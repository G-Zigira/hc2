const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

app.disable('x-powered-by');

// Basic security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

app.use(express.json({ limit: '20kb' }));

// Static files with sensible caching
app.use(
  express.static(PUBLIC_DIR, {
    extensions: ['html'],
    maxAge: '1h',
    setHeaders(res, filePath) {
      if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
    },
  })
);

// --- Contact form API (stores messages locally in data/messages.json) ---
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const list = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(ip, list);
  return list.length > 5;
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.post('/api/contact', (req, res) => {
  const ip = req.ip || 'unknown';
  if (rateLimited(ip)) {
    return res.status(429).json({ ok: false, error: 'Too many messages. Please try again later.' });
  }

  const { name, email, message, consent, website } = req.body || {};

  // Honeypot field: real users never fill this in
  if (website) return res.json({ ok: true });

  if (!name || String(name).trim().length < 2) {
    return res.status(400).json({ ok: false, error: 'Please enter your full name.' });
  }
  if (!email || !emailRe.test(String(email).trim())) {
    return res.status(400).json({ ok: false, error: 'Please enter a valid email address.' });
  }
  if (!message || String(message).trim().length < 10) {
    return res.status(400).json({ ok: false, error: 'Your message should be at least 10 characters.' });
  }
  if (!consent) {
    return res.status(400).json({ ok: false, error: 'Please accept the privacy policy to continue.' });
  }

  const entry = {
    id: Date.now().toString(36),
    receivedAt: new Date().toISOString(),
    name: String(name).trim().slice(0, 120),
    email: String(email).trim().slice(0, 160),
    message: String(message).trim().slice(0, 4000),
  };

  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const existing = fs.existsSync(MESSAGES_FILE)
      ? JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8') || '[]')
      : [];
    existing.push(entry);
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(existing, null, 2));
  } catch (err) {
    console.error('Could not save message:', err.message);
    return res.status(500).json({ ok: false, error: 'Something went wrong. Please email us directly.' });
  }

  console.log(`New message from ${entry.name} <${entry.email}>`);
  res.json({ ok: true });
});

// 404 fallback back to the home page for unknown routes
app.use((req, res) => {
  res.status(404).sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`HC Energy Mobility site running at http://localhost:${PORT}`);
});
