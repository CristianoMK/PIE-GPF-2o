import { Resend } from 'resend';

let cliente;

export async function enviarContato({ assunto, nome, telefone, email, mensagem }, tokenHash) {
  try {
    cliente ??= new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await cliente.emails.send({
      from: process.env.RESEND_FROM,
      to: process.env.RESEND_TO,
      replyTo: email,
      subject: 'Nova solicitação de atendimento',
      text: [
        `Assunto: ${assunto}`,
        `Nome: ${nome}`,
        `Telefone: ${telefone}`,
        `E-mail: ${email}`,
        '',
        mensagem
      ].join('\n')
    }, { idempotencyKey: `contato/${tokenHash}` });

    if (error || !data?.id) throw new Error('Envio não confirmado');
  } catch (error) {
    throw Object.assign(new Error('Falha no Resend', { cause: error }), { status: 502 });
  }
}
