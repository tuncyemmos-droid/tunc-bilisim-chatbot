// conversationEngine.js
//
// Sohbetin "beyni". Akış PRD'nin bıraktığı boşluğa verdiğimiz cevaba göre kurulu:
//   greeting -> name -> need (LLM burada) -> urgency (sabit seçenek) -> email -> done
//
// Neden state machine ve LLM'e her şeyi bırakmadık?
// İsim/aciliyet/email deterministik olmalı ki admin view'de güvenilir, filtrelenebilir
// veri olsun. LLM sadece "ihtiyacı anlama" gibi doğası gereği açık uçlu olan kısımda
// devrede - bu hem maliyeti düşürüyor hem de akışı öngörülebilir kılıyor.

const db = require('./db');
const { askNeedEngine } = require('./llmService');

const MAX_NEED_QUESTIONS = 3;
const SKIP_WORDS = ['geç', 'gecs', 'bilmiyorum', 'atla', 'skip', 'önemli değil', 'boşver', 'yok'];

const URGENCY_LABELS = {
  hemen: 'Hemen konuşmak istiyor',
  bu_hafta: 'Bu hafta içinde',
  sadece_bilgi: 'Sadece bilgi topluyor',
};

function isSkip(message) {
  const m = message.trim().toLowerCase();
  return SKIP_WORDS.some((w) => m.includes(w));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function getOrCreateConversation(sessionId, ipAddress) {
  let convo = db.prepare('SELECT * FROM conversations WHERE session_id = ?').get(sessionId);
  if (!convo) {
    db.prepare(
      `INSERT INTO conversations (session_id, stage, ip_address, messages) VALUES (?, 'greeting', ?, '[]')`
    ).run(sessionId, ipAddress);
    convo = db.prepare('SELECT * FROM conversations WHERE session_id = ?').get(sessionId);
  }
  return convo;
}

function saveMessages(sessionId, messages) {
  db.prepare('UPDATE conversations SET messages = ?, updated_at = datetime(\'now\') WHERE session_id = ?').run(
    JSON.stringify(messages),
    sessionId
  );
}

function updateConversation(sessionId, fields) {
  const keys = Object.keys(fields);
  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => fields[k]);
  db.prepare(`UPDATE conversations SET ${setClause}, updated_at = datetime('now') WHERE session_id = ?`).run(
    ...values,
    sessionId
  );
}

// Sohbeti başlatır - ilk karşılama mesajını döner.
function startConversation(sessionId, ipAddress) {
  const convo = getOrCreateConversation(sessionId, ipAddress);
  const greeting = 'Merhaba! Tunç Bilişim\'e ulaştığınız için teşekkürler. Size daha iyi yardımcı olabilmem için önce sizi tanıyayım — isminizi öğrenebilir miyim?';
  const messages = [{ role: 'assistant', content: greeting }];
  saveMessages(sessionId, messages);
  updateConversation(sessionId, { stage: 'name' });
  return { reply: greeting, stage: 'name', isComplete: false };
}

// Her kullanıcı mesajını, o anki stage'e göre işler.
async function handleMessage(sessionId, userMessage, ipAddress) {
  const convo = getOrCreateConversation(sessionId, ipAddress);
  const messages = JSON.parse(convo.messages || '[]');
  messages.push({ role: 'user', content: userMessage });

  let reply;
  let nextStage = convo.stage;
  let isComplete = false;

  switch (convo.stage) {
    case 'greeting':
    case 'name': {
      const name = userMessage.trim();
      if (!name) {
        reply = 'Adınızı yazabilir misiniz? Böylece size ismen hitap edebilirim :)';
        break;
      }
      updateConversation(sessionId, { name });
      nextStage = 'need';
      reply = `Memnun oldum, ${name}! Peki, Tunç Bilişim ile ilgili size nasıl yardımcı olabiliriz? Ne arıyorsunuz, kısaca anlatır mısınız?`;
      break;
    }

    case 'need': {
      // Need aşamasındaki mesajları LLM'e gönderiyoruz (sadece bu aşamanın geçmişi).
      const needHistory = messages
        .slice(1) // greeting/name adımındaki ilk assistant mesajını hariç tut
        .filter((m, idx) => idx > 0 || m.role === 'user'); // basit temizlik

      const llmResult = await askNeedEngine(
        messages.filter((m) => true).slice(-8) // son birkaç mesajla yetin, maliyeti düşük tut
      );

      const questionCount = convo.need_question_count + 1;
      const forceDone = questionCount >= MAX_NEED_QUESTIONS;

      if (llmResult.done || forceDone) {
        const summary = llmResult.summary || userMessage;
        updateConversation(sessionId, {
          need_summary: summary,
          need_question_count: questionCount,
        });
        nextStage = 'urgency';
        reply = `${llmResult.reply} Bir de merak ediyorum: bu sizin için ne kadar acil? "Hemen konuşmak istiyorum", "Bu hafta içinde" veya "Sadece bilgi alıyorum" diyebilirsiniz.`;
      } else {
        updateConversation(sessionId, { need_question_count: questionCount });
        reply = llmResult.reply;
      }
      break;
    }

    case 'urgency': {
      const m = userMessage.trim().toLowerCase();
      let urgency = null;
      if (m.includes('hemen') || m.includes('acil')) urgency = 'hemen';
      else if (m.includes('hafta')) urgency = 'bu_hafta';
      else if (m.includes('bilgi')) urgency = 'sadece_bilgi';

      if (!urgency) {
        reply = 'Anlamadım, şu üç seçenekten birini seçebilir misiniz: "Hemen", "Bu hafta içinde" ya da "Sadece bilgi alıyorum"?';
        break;
      }

      updateConversation(sessionId, { urgency });
      nextStage = 'email';
      reply = 'Anladım, not ettim! Son olarak, sizinle iletişime geçebilmemiz için e-posta adresinizi alabilir miyim?';
      break;
    }

    case 'email': {
      if (isSkip(userMessage)) {
        // Ziyaretçi e-posta vermek istemiyor - ısrar etmiyoruz, talebi email'siz kapatıyoruz.
        nextStage = 'done';
        isComplete = true;
        reply = 'Sorun değil, anlıyorum. Talebinizi e-posta olmadan da ekibimize ilettim - ama sizinle iletişime geçebilmemiz e-posta olmadan mümkün olmayacak. İsterseniz istediğiniz zaman geri gelip paylaşabilirsiniz. Vaktiniz için teşekkürler!';
        finalizeLead(sessionId, convo, null);
        break;
      }
      if (!isValidEmail(userMessage)) {
        reply = 'Bu bir e-posta adresine benzemiyor, tekrar yazabilir misiniz? (İsterseniz "geç" diyerek bu adımı atlayabilirsiniz.)';
        break;
      }
      updateConversation(sessionId, { email: userMessage.trim() });
      nextStage = 'done';
      isComplete = true;
      reply = `Teşekkürler! Talebinizi aldık, ekibimiz en kısa sürede ${userMessage.trim()} adresi üzerinden sizinle iletişime geçecek. İyi günler!`;
      finalizeLead(sessionId, convo, userMessage.trim());
      break;
    }

    case 'done':
    default: {
      reply = 'Bu görüşme tamamlandı. Yeni bir talep oluşturmak isterseniz sayfayı yenileyip tekrar başlayabilirsiniz.';
      isComplete = true;
      break;
    }
  }

  messages.push({ role: 'assistant', content: reply });
  saveMessages(sessionId, messages);
  updateConversation(sessionId, { stage: nextStage });

  return { reply, stage: nextStage, isComplete };
}

// Sohbet tamamlandığında leads tablosuna kalıcı bir kayıt düşer.
function finalizeLead(sessionId, convo, email) {
  const fresh = db.prepare('SELECT * FROM conversations WHERE session_id = ?').get(sessionId);
  db.prepare(
    `INSERT INTO leads (name, need_summary, urgency, email, status, raw_conversation)
     VALUES (?, ?, ?, ?, 'completed', ?)`
  ).run(fresh.name, fresh.need_summary, fresh.urgency, email, fresh.messages);
}

module.exports = { startConversation, handleMessage, URGENCY_LABELS };
