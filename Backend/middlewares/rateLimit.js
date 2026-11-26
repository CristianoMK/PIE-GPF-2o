const janela = 10 * 60 * 1000;
const registros = new Map();

setInterval(() => {
  const agora = Date.now();
  for (const [ip, registro] of registros) {
    if (registro.expira <= agora) registros.delete(ip);
  }
}, 60_000).unref();

export function rateLimit(req, res, next) {
  const agora = Date.now();
  let registro = registros.get(req.ip);
  if (!registro || registro.expira <= agora) {
    if (!registro && registros.size >= 10_000) {
      res.set('Retry-After', '60');
      return res.status(503).json({ ok: false, mensagem: 'Tente novamente em instantes.' });
    }
    registro = { tentativas: 0, expira: agora + janela };
    registros.set(req.ip, registro);
  }
  if (registro.tentativas >= 5) {
    res.set('Retry-After', String(Math.ceil((registro.expira - agora) / 1000)));
    return res.status(429).json({ ok: false, mensagem: 'Muitas tentativas. Aguarde antes de reenviar.' });
  }
  registro.tentativas++;
  next();
}
