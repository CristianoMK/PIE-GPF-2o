export async function validarTurnstile(token, hostname, production) {
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: process.env.TURNSTILE_SECRET_KEY, response: token }),
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) throw new Error('Siteverify indisponível');
    const resultado = await response.json();
    if (typeof resultado.success !== 'boolean' ||
        resultado['error-codes']?.some(code =>
          ['internal-error', 'invalid-input-secret', 'missing-input-secret'].includes(code))) {
      throw new Error('Falha no Siteverify');
    }

    return resultado.success && (!production ||
      (resultado.hostname === hostname && resultado.action === 'contato'));
  } catch (error) {
    throw Object.assign(new Error('Falha no Turnstile', { cause: error }), { status: 502 });
  }
}
