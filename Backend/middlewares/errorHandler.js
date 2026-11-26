const mensagens = {
  400: 'JSON inválido.',
  413: 'Os dados ultrapassam o tamanho permitido.',
  415: 'Formato de requisição não suportado.',
  502: 'Não foi possível concluir o envio. Tente novamente.'
};

export function errorHandler(error, _req, res, next) {
  if (res.headersSent) return next(error);
  const status = Object.hasOwn(mensagens, error.status) ? Number(error.status) : 500;
  if (status >= 500) console.error('Falha na API de contato', status);
  res.status(status).json({ ok: false, mensagem: mensagens[status] || 'Erro ao processar a solicitação.' });
}
