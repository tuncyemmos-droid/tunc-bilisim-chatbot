// llmService.js
// Harici yapay zekâ bağlantısı geçici olarak kapalı.
// Chatbot bu sürümde hızlı ve takılmadan çalışır.

async function askNeedEngine(conversationHistory) {
  const userMessages = conversationHistory
    .filter((message) => message.role === 'user')
    .map((message) => String(message.content || '').trim())
    .filter(Boolean);

  // İlk kullanıcı mesajı isimdir.
  // Sonraki mesajlar ihtiyaç açıklamasıdır.
  const needMessages = userMessages.slice(1);

  if (needMessages.length <= 1) {
    return {
      reply:
        'Anladım. Bu chatbotu hangi amaçla kullanmak istiyorsunuz? Örneğin satış, müşteri desteği veya bilgi verme amacıyla mı?',
      done: false,
    };
  }

  return {
    reply: 'Teşekkürler, ihtiyacınızı anladım ve not aldım.',
    done: true,
    summary: needMessages.join(' ').slice(0, 500),
  };
}

module.exports = { askNeedEngine };