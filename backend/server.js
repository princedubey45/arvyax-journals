require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const journalRoutes = require('./routes/journal');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting (bonus: rate limiting)
const limiter = rateLimit({
   windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Routes
app.use('/api/journal', journalRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.status(204).end();
});
app.listen(PORT, () => {
  console.log(`ArvyaX Journal API running on http://localhost:${PORT}`);
});
