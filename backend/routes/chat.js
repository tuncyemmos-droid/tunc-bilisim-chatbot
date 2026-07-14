// backend/routes/chat.js

const express = require('express');
const router = express.Router();

const {
  startConversation,
  handleMessage,
} = require('../conversationEngine');

const {
  honeypotCheck,
} = require('../middleware/honeypot');


// Sohbet başlatma
router.post('/start', honeypotCheck, (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        error: 'sessionId gerekli',
      });
    }

    const result = startConversation(
      sessionId,
      req.ip
    );

    res.json(result);

  } catch (err) {

    console.error(
      'Chat start hatası:',
      err
    );

    res.status(500).json({
      error: 'Başlatma sırasında hata oluştu.',
    });
  }
});


// Kullanıcı mesajlarını işler
router.post('/message', honeypotCheck, async (req, res) => {

  const {
    sessionId,
    message,
  } = req.body;


  if (
    !sessionId ||
    typeof message !== 'string' ||
    !message.trim()
  ) {

    return res.status(400).json({
      error: 'sessionId ve message gerekli',
    });

  }


  try {

    console.log(
      'CHAT MESAJ GELDİ:',
      message
    );


    const result = await handleMessage(
      sessionId,
      message,
      req.ip
    );


    res.json(result);


  } catch (err) {


    console.error(
      'Chat işleme hatası:',
      err
    );


    res.status(500).json({

      error:
        'Bir şeyler ters gitti, lütfen tekrar deneyin.'

    });

  }

});


module.exports = router;