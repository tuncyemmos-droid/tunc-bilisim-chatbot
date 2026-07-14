// llmService.js
//
// Tunç Bilişim AI Sales Agent
// conversationEngine.js ile uyumlu Gemini servisi

'use strict';

const { GoogleGenAI } = require('@google/genai');
const { COMPANY_KNOWLEDGE } = require('./companyKnowledge');

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

let aiClient = null;


/**
 * conversationEngine.js bunu şu şekilde çağırıyor:
 *
 * askNeedEngine(messages)
 *
 * Dönüş:
 * {
 *   done: true/false,
 *   reply: "...",
 *   summary: "..."
 * }
 */
async function askNeedEngine(messages = []) {

  const history = normalizeMessages(messages);

  const lastUserMessage =
    [...history]
      .reverse()
      .find((m) => m.role === 'user');


  const userMessage = lastUserMessage
    ? lastUserMessage.content
    : '';


  if (!userMessage) {
    return {
      done: false,
      reply: 'İhtiyacınızı biraz daha anlatabilir misiniz?',
      summary: null
    };
  }


  try {

    const response = await askGemini({
      history,
      userMessage
    });


   const result = normalizeResult(response);

console.log("NORMALIZE SONUCU:", result);

return result;


  } catch (error) {

    console.error(
      'LLM Error:',
      error.message
    );


    return fallbackResult(userMessage);

  }
}


/**
 * Gemini çağrısı
 */
async function askGemini({
  history,
  userMessage
}) {

  const client = getClient();


  const prompt = `
Sen Tunç Bilişim'in AI satış danışmanısın.

Görevin:
Müşterinin yazılım ihtiyacını anlamak.

Şirket bilgileri:

${COMPANY_KNOWLEDGE}


Kurallar:

- Türkçe cevap ver.
- Kısa cevap ver.
- Profesyonel ve samimi ol.
- İsim isteme.
- Mail isteme.
- Telefon isteme.
- Aciliyet isteme.
- Aciliyet hakkında hiçbir soru sorma. Aciliyet seçimini backend ayrı bir adımda soracak.
- "Hemen", "Bu hafta içinde", "Sadece bilgi alıyorum" gibi ifadeleri kullanma.
- Fiyat uydurma.
- Bilmediğin hizmetleri söyleme.

Amaç:
Müşterinin ne yaptırmak istediğini anlamak.

Eğer ihtiyaç yeterince açıksa:
done = true yap.

Eğer daha fazla bilgi gerekiyorsa:
done = false yap ve sadece bir soru sor.


Konuşma geçmişi:

${history
  .map((m) => `${m.role}: ${m.content}`)
  .join('\n')}


Son müşteri mesajı:

${userMessage}


Sadece şu JSON formatında cevap ver:

{
 "done": true veya false,
 "reply": "müşteriye gönderilecek cevap",
 "summary": "ihtiyaç özeti veya null"
}

`;



  const result = await client.models.generateContent({

    model: MODEL,

    contents: [
      {
        role: 'user',
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],

    config: {
      temperature: 0.2,
      responseMimeType: 'application/json'
    }

  });


  const text = extractText(result);

return text
  .replace(/Bir de merak ediyorum:.*$/is, '')
  .replace(/bu sizin için ne kadar acil\?.*$/is, '')
  .replace(/"Hemen konuşmak istiyorum".*$/is, '')
  .replace(/"Bu hafta içinde".*$/is, '')
  .replace(/"Sadece bilgi alıyorum".*$/is, '')
  .trim();

}


/**
 * Gemini client
 */
function getClient() {

  if (aiClient) {
    return aiClient;
  }


  aiClient = new GoogleGenAI({

    apiKey:
      process.env.GEMINI_API_KEY

  });


  return aiClient;

}
/**
 * Gemini çıktısını temiz şekilde alır
 */
function extractText(response) {

  if (!response) {
    return '';
  }


  if (typeof response.text === 'string') {
    return response.text;
  }


  if (typeof response.text === 'function') {
    return response.text();
  }


  return '';

}



/**
 * Gemini JSON cevabını normalize eder
 */
function normalizeResult(raw) {
  console.log("RAW GEMINI CEVABI:", raw);

  let data;


  try {

    if (typeof raw === 'string') {

      data = JSON.parse(raw);

    } else {

      data = raw;

    }


  } catch (error) {

    return {
      done: false,
      reply: 'İhtiyacınızı biraz daha detaylandırabilir misiniz?',
      summary: null
    };

  }



  let cleanReply =
  data.reply ||
  'İhtiyacınızı biraz daha anlatabilir misiniz?';
  if (cleanReply.includes('Bir de merak ediyorum')) {
  cleanReply = cleanReply.split('Bir de merak ediyorum')[0];
}


// Gemini yanlışlıkla aciliyet eklerse temizle
cleanReply = cleanReply
  .replace(/Bir de merak ediyorum:.*$/i, '')
  .replace(/bu sizin için ne kadar acil.*$/i, '')
  .replace(/"Hemen konuşmak istiyorum".*$/i, '')
  .replace(/"Bu hafta içinde".*$/i, '')
  .replace(/"Sadece bilgi alıyorum".*$/i, '')
  .trim();


return {

  done:
    data.done === true,

  reply:
    cleanReply,

  summary:
    data.summary ||
    null

};

}



/**
 * Gemini çalışmazsa sohbet kırılmasın
 */
function fallbackResult(message) {


  const lower =
    message.toLocaleLowerCase('tr-TR');



  if (
    lower.includes('web') ||
    lower.includes('site')
  ) {

    return {

      done: false,

      reply:
        'Web sitesiyle ilgili nasıl bir çözüm aradığınızı biraz anlatabilir misiniz?',

      summary: null

    };

  }



  if (
    lower.includes('mobil') ||
    lower.includes('uygulama')
  ) {

    return {

      done: false,

      reply:
        'Mobil uygulamanızın hangi ihtiyacı çözmesini istediğinizi anlatabilir misiniz?',

      summary: null

    };

  }



  return {

    done: false,

    reply:
      'Size en doğru çözümü önerebilmem için ihtiyacınızı biraz daha anlatabilir misiniz?',

    summary: null

  };

}



/**
 * Mesaj formatlarını standartlaştırır
 */
function normalizeMessages(messages) {


  if (!Array.isArray(messages)) {

    return [];

  }



  return messages
    .map((m) => {


      if (!m) {
        return null;
      }



      return {

        role:
          m.role === 'assistant'
            ? 'assistant'
            : 'user',


        content:
          String(
            m.content || ''
          ).trim()

      };


    })
    .filter(
      (m) =>
        m &&
        m.content
    );

}



module.exports = {
  askNeedEngine
};