const formulario = document.getElementById('contactForm');
const botao = document.getElementById('submitBtn');
const statusEnvio = document.getElementById('contactStatus');

formulario.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (botao.disabled) return;

  const campos = new FormData(formulario);
  const token = campos.get('cf-turnstile-response');
  statusEnvio.hidden = false;
  if (!token) {
    statusEnvio.textContent = 'Conclua a verificação de segurança antes de enviar.';
    return;
  }

  const dados = Object.fromEntries(
    ['assunto', 'nome', 'telefone', 'email', 'mensagem'].map(campo => [campo, campos.get(campo)])
  );
  dados.token = token;
  botao.disabled = true;
  statusEnvio.textContent = 'Enviando solicitação…';

  try {
    const resposta = await fetch(formulario.dataset.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
      signal: AbortSignal.timeout(30_000)
    });
    const resultado = await resposta.json();
    statusEnvio.textContent = resultado.mensagem;
    if (resposta.ok && resultado.ok) formulario.reset();
  } catch {
    statusEnvio.textContent = 'Não foi possível confirmar o envio. Tente novamente.';
  } finally {
    botao.disabled = false;
    window.turnstile?.reset();
  }
});
