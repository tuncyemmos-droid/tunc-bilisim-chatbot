// llmService.js
//
// LLM'i SADECE "need" (ihtiyaç) adımında kullanıyoruz. İsim, aciliyet ve
// e-posta adımları bilinçli olarak deterministik (sabit soru/seçenek) tutuldu
// çünkü bu alanlar satış ekibinin güvenle filtreleyebileceği, tutarlı veri
// olmalı. LLM'e bırakılsaydı aynı soru her seferinde farklı ifade edilir,
// parse etmek zorlaşır ve "aciliyet" gibi kritik bir alanda yanlış çıkarım
// riski oluşurdu (bkz. README - "sana bıraktıklarımız" bölümündeki gerekçe).
//
// Burada LLM'in tek işi: ziyaretçinin ihtiyacını 1-3 kısa, doğal soruyla
// anlamak ve yeterli bilgiye ulaşınca "done" işareti ile kısa bir özet üretmek.
//
// Model: Google Gemini API (ücretsiz katman, kredi kartı gerektirmiyor).

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-3.5-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `Sen Tunç Bilişim adlı bir B2B SaaS şirketinin web sitesindeki chatbotsun.
Tunç Bilişim, orta ölçekli e-ticaret firmalarına analitik dashboard hizmeti sunar.

TON: Sıcak ve samimi ama aynı zamanda profesyonel. "Siz" hitabı kullan, kısa ve
doğal cümleler kur, robotik/kalıp ifadelerden kaçın. Ne aşırı gayri resmi
("Selam kanka") ne de soğuk kurumsal bir dil kullanma.

GÖREVİN: Ziyaretçinin Tunç Bilişim'den ne beklediğini, hangi ihtiyacı için
ulaştığını 1 ila 3 kısa soruyla anlamak. Amacın satış ekibinin takip edebileceği
kadar net bir ihtiyaç özeti çıkarmak (örn: "Aylık 50 bin sipariş hacmi olan bir
e-ticaret sitesi için analitik dashboard fiyatlandırması ile ilgileniyor").

KURALLAR:
- En fazla 3 soru sorabilirsin. 3. sorudan sonra elindeki bilgiyle özet çıkarmak ZORUNDASIN.
- Ziyaretçi bir soruyu cevaplamak istemezse ("bilmiyorum", "geç", "önemli değil" gibi)
  ISRAR ETME, elindeki bilgiyle devam et veya özetle.
- Eğer ziyaretçinin cevabı zaten yeterince net ve tek soruda anlaşılabiliyorsa,
  ekstra soru sorma, direkt özetle.
- Cevabın SADECE geçerli JSON olmalı, başka hiçbir metin ekleme. Format:
  {"reply": "ziyaretçiye gösterilecek mesaj", "done": false}
  veya yeterli bilgiye ulaştığında:
  {"reply": "kısa kapanış mesajı", "done": true, "summary": "satış ekibi için 1 cümlelik ihtiyaç özeti"}
`;

async function askNeedEngine(conversationHistory) {
  // Gemini API "assistant" yerine "model" rolü bekliyor, dönüştürüyoruz.
  const contents = conversationHistory.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: { maxOutputTokens: 300 },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API hatası: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  const cleaned = rawText.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('LLM JSON parse hatası:', rawText);
    return {
      reply: 'Anladım, biraz daha anlatır mısınız?',
      done: false,
    };
  }
}

module.exports = { askNeedEngine };