// routes/leads.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Admin view'in kullandığı tek endpoint. Aciliyete göre sıralı liste döner:
// hemen > bu_hafta > sadece_bilgi > (belirtilmemiş). Bu sıralama, PRD'nin
// "iyi lead'i kötüsünden ayırt etme" sorusuna verdiğimiz cevabın (aciliyet
// seviyesi = öncelik sinyali) doğrudan yansıması.
router.get('/', (req, res) => {
  const leads = db
    .prepare(
      `SELECT id, name, need_summary, urgency, email, status, created_at
       FROM leads
       ORDER BY
         CASE urgency
           WHEN 'hemen' THEN 1
           WHEN 'bu_hafta' THEN 2
           WHEN 'sadece_bilgi' THEN 3
           ELSE 4
         END,
         created_at DESC`
    )
    .all();
  res.json(leads);
});

module.exports = router;
