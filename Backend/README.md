# API de contato

Use Node.js 24 LTS ou 26 LTS. Na raiz do projeto, execute:

```sh
cd Backend
cp .env.example .env
npm install
```

Preencha `Backend/.env` conforme os comentários do exemplo. Use `RESEND_API_KEY` para
a chave de envio do Resend e `TURNSTILE_SECRET_KEY` para a chave secreta do widget.
Configure `RESEND_FROM` com um endereço no domínio verificado no Resend e `RESEND_TO`
com a caixa que receberá os contatos.

No `solicitacao.html`, substitua `SUA_SITE_KEY_PUBLICA`, no atributo `data-sitekey`,
pela **Site Key** do mesmo widget. Para testar em localhost, use o par de chaves de
teste da Cloudflare. Um teste que chega ao Resend envia e-mail ao destinatário
configurado.

- [Chaves de teste do Turnstile](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)
- [Como enviar e-mails com Resend e Node.js](https://resend.com/nodejs)

Execute `npm start` dentro de `Backend/`. Em outro terminal, com Python disponível,
sirva somente os arquivos do frontend para teste local:

```sh
# Execute na raiz do projeto em um shell POSIX
frontend_dir=$(mktemp -d)
cp index.html solicitacao.html style.css solicitacao.css script.js forms.js "$frontend_dir/"
cp -R assets "$frontend_dir/"
python3 -m http.server 5500 --bind 127.0.0.1 --directory "$frontend_dir"
```

Abra `http://localhost:5500/solicitacao.html`. A origem deve coincidir com
`FRONTEND_URL`. O atributo `data-api-url` aponta para a API e o formulário envia
`assunto`, `nome`, `telefone`, `email`, `mensagem` e `token` como JSON.
A API responde com `ok` e `mensagem` em JSON.

## Produção

- Publique os arquivos do frontend e `assets/` separadamente da pasta `Backend/`.
- Configure as variáveis no painel da hospedagem do Node.js. Use `NODE_ENV=production`
  e coloque a origem HTTPS exata do site em `FRONTEND_URL`.
- Em `solicitacao.html`, coloque a Site Key de produção e ajuste `data-api-url` para
  a URL HTTPS pública da API, terminada em `/api/contato`. Cadastre o hostname do site
  no widget Turnstile.
- Termine HTTPS no proxy ou na hospedagem. Se um proxy encaminhar as conexões ao
  Node, configure `TRUST_PROXY` com o IP ou CIDR confiável informado pelo provedor.
- O limite é de cinco POSTs por IP a cada dez minutos, por instância Node. Em
  produção com várias instâncias, aplique também o limite por IP no proxy para
  obter uma cota global.
