// honeypot.js
//
// Kötü niyetli kullanıma karşı 2. katman: frontend'de kullanıcıya görünmeyen
// (CSS ile gizlenmiş) bir input alanı var - "website" adında. Gerçek bir
// ziyaretçi bunu asla dolduramaz çünkü göremiyor bile. Ama otomatik form
// dolduran botlar genelde her alanı doldurur. Bu alan doluysa isteği
// sessizce reddediyoruz (bota "yakalandın" sinyali vermemek için normal
// bir başarı cevabı döndürüyoruz, ama sohbeti hiç ilerletmiyoruz).

function honeypotCheck(req, res, next) {
  const { honeypot } = req.body;
  if (honeypot && honeypot.trim() !== '') {
    console.warn('Honeypot tetiklendi, muhtemelen bot trafiği:', req.ip);
    // Bota fark ettirmemek için sahte bir "başarılı" cevap dönüyoruz.
    return res.json({ reply: 'Teşekkürler!', stage: 'done', isComplete: true });
  }
  next();
}

module.exports = { honeypotCheck };
