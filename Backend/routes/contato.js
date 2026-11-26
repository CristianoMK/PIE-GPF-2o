import { createHash } from 'node:crypto';
import { validarTurnstile } from '../services/turnstile.js';
import { enviarContato } from '../services/resend.js';

const assuntos = new Set([
  'Direito Civil',
  'Direito de Família e Sucessões',
  'Direito do Trabalho',
  'Direito do Consumidor',
  'Direito Penal',
  'Outro assunto'
]);

const limites = { assunto: 80, nome: 120, telefone: 24, email: 254, mensagem: 3000, token: 2048 };
const tokens = new Map();
const validade = 5 * 60_000;

setInterval(() => {
  const agora = Date.now();
  for (const [hash, expira] of tokens) {
    if (expira <= agora) tokens.delete(hash);
  }
}, 60_000).unref();

export function contato(hostname, production) {
  return async (req, res) => {
    const dados = {};
    for (const [campo, maximo] of Object.entries(limites)) {
      const valor = req.body?.[campo];
      if (typeof valor !== 'string' || !valor.trim() || valor.length > maximo) {
        return res.status(400).json({ ok: false, mensagem: `Confira o campo ${campo}.` });
      }
      dados[campo] = valor.trim();
    }

    const digitos = dados.telefone.replace(/\D/g, '').length;
    if (!assuntos.has(dados.assunto) || /[\x00-\x1f\x7f]/.test(dados.nome) ||
        !/^\+?[0-9 ().-]+$/.test(dados.telefone) || digitos < 10 || digitos > 15 ||
        !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(dados.email) ||
        dados.email.split('@')[0].length > 64 || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(dados.mensagem)) {
      return res.status(400).json({ ok: false, mensagem: 'Confira os dados do formulário.' });
    }

    const hash = createHash('sha256').update(dados.token).digest('hex');
    const agora = Date.now();
    const desafioInvalido = () => res.status(400).json({
      ok: false, mensagem: 'Refaça a verificação de segurança e tente novamente.'
    });
    if (tokens.get(hash) > agora) return desafioInvalido();

    tokens.set(hash, agora + validade);
    let validado = false;
    try {
      validado = await validarTurnstile(dados.token, hostname, production);
      if (!validado) return desafioInvalido();
      await enviarContato(dados, hash);
      res.json({ ok: true, mensagem: 'Solicitação enviada com sucesso.' });
    } finally {
      if (!validado) tokens.delete(hash);
    }
  };
}
