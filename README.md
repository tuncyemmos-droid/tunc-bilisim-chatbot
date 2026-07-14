# NextReach — Web Chatbot İletişim Agent'ı

> ⚠️ **Doldurulması gereken alanlar:** Bu README, PRD'nin istediği tüm başlıkları
> içeriyor ama birkaç yeri sana bırakıldı (aşağıda `[SEN DOLDUR]` ile işaretli).
> Bunlar gerçek geliştirme sürecine ait bilgiler (harcadığın süre, elle test
> ettiğin senaryolar) — benim yerime dolduramayacağım kısımlar bunlar, çünkü
> mülakatta bunları sana soracaklar.

## Ne yapıldı

Landing page'deki "Bize Ulaşın" butonuna tıklayınca form yerine açılan bir
chatbot: ziyaretçiyi karşılıyor, ihtiyacını anlıyor, aciliyetini ve iletişim
bilgisini alıp satış ekibinin aksiyon alabileceği bir "lead" oluşturuyor.
Ekip bu lead'leri `/admin` altındaki basit tabloda, aciliyete göre sıralanmış
şekilde görebiliyor.

## Nasıl çalıştırılır (lokalde)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# .env dosyasına kendi ANTHROPIC_API_KEY'ini yaz
npm run dev
```

Backend `http://localhost:3001` üzerinde çalışır. İlk çalıştırmada
`backend/data/nextreach.db` SQLite dosyası otomatik oluşturulur.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend `http://localhost:5173` üzerinde açılır (Vite dev server, `/api`
isteklerini otomatik olarak backend'e proxy'ler — bkz. `vite.config.js`).

- `http://localhost:5173/` → landing page + chatbot
- `http://localhost:5173/admin` → gelen taleplerin listesi

## Hangi teknolojileri seçtin ve neden

| Katman | Seçim | Neden |
|---|---|---|
| Frontend | React (Vite) | Hızlı kurulum, component bazlı chat arayüzü için doğal bir uyum |
| Backend | Node.js + Express | Küçük bir API yüzeyi için minimal, hızlı kurulan bir katman |
| Veritabanı | SQLite (better-sqlite3) | Tek dosya, sıfır kurulum, senkron API — 6 saatlik bir teslimatta ayrı bir DB sunucusu yönetmek zaman kaybı. Ölçek gerekirse Postgres/Supabase'e geçiş küçük bir migration işi olur. |
| LLM | Claude API (`claude-sonnet-4-6`) | Sadece "ihtiyacı anlama" adımında kullanıldı — aşağıda gerekçesi var |

**Neden LLM her yerde değil, sadece bir adımda?** İsim, aciliyet ve e-posta
adımları bilinçli olarak deterministik (sabit soru/seçenek) tutuldu. Bu
alanlar admin view'de satış ekibinin güvenle filtreleyip sıralayabileceği
tutarlı veri olmalı. LLM'e bırakılsaydı her seferinde farklı ifade edilir,
parse etmesi zorlaşır ve özellikle "aciliyet" gibi önceliklendirme için
kritik bir alanda yanlış çıkarım riski oluşurdu. LLM'in tek işi ihtiyaç
gibi doğası gereği açık uçlu olan kısmı 1-3 doğal soruyla anlamak.

## PRD'de muğlak bırakılan yerleri nasıl yorumladım

**Chatbot ziyaretçiye ne soracak, hangi sırayla, ne zaman "yeter" diyecek?**
Akış: `isim → ihtiyaç (LLM ile, en fazla 3 soru) → aciliyet (sabit 3 seçenek)
→ e-posta`. İsim buz kırıcı ve samimi bir başlangıç; ihtiyaç kısmı ziyaretçinin
cevabına göre uyarlanan, en fazla 3 soruluk bir keşif (3. soruda LLM elindeki
bilgiyle özet çıkarmak zorunda, sonsuz soru sorma riski yok); aciliyet en
sona değil ihtiyaçtan hemen sonra soruluyor çünkü önceliklendirme sinyali
olarak en çok işe yarayan bilgi bu; e-posta en sona bırakıldı çünkü kişisel
bilgi istemeden önce sohbetle bir güven inşa edilmiş oluyor.

**Chatbot'un tonu ve kişiliği nasıl olmalı?** Sıcak ama profesyonel: "siz"
hitabı, doğal ve kısa cümleler, ama slang/emoji ağırlıklı bir dil değil.
Amaç, PRD'deki "form çok soğuk" şikayetini çözerken B2B bağlamının
gerektirdiği güveni de korumak — tamamen gündelik bir ton bazı karar
vericiler için ciddiyetsiz hissettirebilirdi.

**Satış ekibi "iyi bir lead"i kötüsünden nasıl ayırt edecek?** Aciliyet
seviyesi üzerinden: "Hemen" = yüksek öncelik, "Bu hafta içinde" = orta,
"Sadece bilgi alıyorum" = düşük. Aciliyeti serbest metinden LLM'e çıkarttırmak
yerine sabit 3 seçenekle sormayı tercih ettim (bkz. yukarıdaki LLM gerekçesi)
— bu hem tutarlılık sağlıyor hem de yanlış etiketleme riskini ortadan
kaldırıyor.

**Admin view'de hangi bilgi nasıl gösterilirse ekibin hayatı kolaylaşır?**
İsim, ihtiyaç özeti, aciliyet (renkli etiket olarak), e-posta ve tarih —
hepsi tek satırda, aciliyete göre sıralı (en acil en üstte). Renk kodlama
(kırmızı/amber/gri) sayesinde ekip listeye bakar bakmaz önceliklendirme
yapabiliyor.

**Kötü niyetli kullanım (spam, bot trafiği) için ne yapıldı?** İki katman:
(1) Rate limiting — aynı IP'den dakikada 20 mesajdan fazlası engelleniyor.
(2) Honeypot — ekranda görünmeyen bir form alanı; botlar genelde her alanı
doldurduğu için bu alan doluysa istek sessizce (bota fark ettirmeden)
reddediliyor. Daha gelişmiş bir çözüm (reCAPTCHA, davranışsal analiz)
6 saatlik kapsamda orantısız zaman alacağı için tercih edilmedi —
"Daha fazla zamanda ne eklerdin" bölümünde bu genişletilebilir.

**Ziyaretçi bir sorunun cevabını vermek istemezse ne olur?** Chatbot ısrar
etmiyor. İhtiyaç adımında ziyaretçi cevap vermek istemezse elindeki bilgiyle
özetler ve devam eder. E-posta adımında "geç"/"bilmiyorum" gibi bir cevap
gelirse talebi e-postasız kapatır ama ekibin iletişime geçemeyeceğini
nazikçe belirtir — çünkü e-posta olmadan takip mekanik olarak imkansız,
bunu gizlemek yanlış olur.

## 6 saatte neyi yapamadın, daha fazla zamanda ne eklerdin

`[SEN DOLDUR]` — Gerçekten denediğin/atladığın şeyleri buraya yaz. Aklımda
bazı adaylar (istersen kullan, istersen kendi listeni yaz):

- Admin view'de filtreleme/arama (örn. sadece "hemen" olanları göster)
- Lead durumunu admin'den güncelleme (örn. "iletişime geçildi" işaretleme)
- Honeypot + rate limiting ötesinde daha gelişmiş bot tespiti
- Chatbot'un LLM yanıtlarının otomatik testleri (şu an manuel test edildi)
- Sohbet geçmişinin admin view'den detaylı görüntülenmesi (şu an sadece DB'de duruyor, `raw_conversation` alanında)
- Mobil'de chat widget'ın son haliyle gerçek cihazda test edilmesi

## Toplam süre

`[SEN DOLDUR]` — PRD "saati başlatmak/durdurmak sana ait" diyor, gerçek
harcadığın süreyi buraya yaz.
