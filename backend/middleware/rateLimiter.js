// rateLimiter.js
//
// Kötü niyetli kullanıma karşı 1. katman: aynı IP'den kısa sürede aşırı
// istek gelirse engelle. Basit ama etkili - express-rate-limit paketi
// bunu tek satırda çözüyor, 6 saatlik bütçede özel bir çözüm yazmaya değmez.

const rateLimit = require('express-rate-limit');

const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 dakika
  max: 20, // dakikada en fazla 20 mesaj (normal bir sohbet için bolca yeterli)
  message: { error: 'Çok fazla istek gönderildi, lütfen biraz bekleyin.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { chatRateLimiter };
