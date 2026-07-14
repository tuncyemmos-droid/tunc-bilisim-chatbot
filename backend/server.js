// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const chatRoutes = require('./routes/chat');
const leadsRoutes = require('./routes/leads');
const { chatRateLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/chat', chatRateLimiter, chatRoutes);
app.use('/api/leads', leadsRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Prod'da frontend'in derlenmiş halini (frontend/dist) aynı sunucudan
// yayınlıyoruz. Böylece tek bir deploy, tek bir link yeterli oluyor.
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`NextReach backend ${PORT} portunda çalışıyor`);
});