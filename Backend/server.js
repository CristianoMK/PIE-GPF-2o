import express from 'express';
import { contato } from './routes/contato.js';
import { rateLimit } from './middlewares/rateLimit.js';
import { errorHandler } from './middlewares/errorHandler.js';

for (const name of ['FRONTEND_URL', 'RESEND_API_KEY', 'RESEND_FROM',
  'RESEND_TO', 'TURNSTILE_SECRET_KEY']) {
  if (!process.env[name]?.trim()) throw new Error(`Configure ${name} no backend.`);
}

const frontend = new URL(process.env.FRONTEND_URL);
const production = process.env.NODE_ENV === 'production';
if (!['http:', 'https:'].includes(frontend.protocol) ||
    (production && frontend.protocol !== 'https:')) {
  throw new Error('Configure FRONTEND_URL com uma origem válida (HTTPS em produção).');
}
if (production && /^\d+x0{8}/.test(process.env.TURNSTILE_SECRET_KEY)) {
  throw new Error('Configure a chave Turnstile de produção.');
}

const app = express();
app.disable('x-powered-by');
if (process.env.TRUST_PROXY) app.set('trust proxy', process.env.TRUST_PROXY);

app.use('/api/contato', (req, res, next) => {
  res.vary('Origin');
  res.set('Cache-Control', 'no-store');
  const origin = req.get('Origin');
  if (origin && origin !== frontend.origin) {
    return res.status(403).json({ ok: false, mensagem: 'Origem não autorizada.' });
  }
  if (origin) res.set('Access-Control-Allow-Origin', origin);
  next();
});

app.options('/api/contato', (_req, res) => {
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(204);
});

app.post('/api/contato', rateLimit, (req, res, next) => {
  if (!req.is('application/json')) {
    return res.status(415).json({ ok: false, mensagem: 'Envie os dados em JSON.' });
  }
  next();
}, express.json({ limit: '48kb', inflate: false }), contato(frontend.hostname, production));

app.use((_req, res) => res.status(404).json({ ok: false, mensagem: 'Rota não encontrada.' }));
app.use(errorHandler);

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.info(`API de contato na porta ${port}.`));
