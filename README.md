# apoia

Uma página simples pra receber apoio via Pix — pra quem mantém projeto open source
no Brasil. Inspirada no [Buy Me a Coffee](https://buymeacoffee.com), mas feita pro
público daqui: **só Pix**, sem pedir e-mail, CPF ou telefone.

Self-hosted: roda no seu servidor, com a sua conta Pix.

[![Release](https://github.com/valtlfelipe/apoia/actions/workflows/release.yml/badge.svg)](https://github.com/valtlfelipe/apoia/actions/workflows/release.yml)
[![Release](https://img.shields.io/github/v/release/valtlfelipe/apoia)](https://github.com/valtlfelipe/apoia/releases)
[![Licença](https://img.shields.io/badge/licença-AGPL--3.0-blue.svg)](LICENSE)

![Página de apoio via Pix com timeline pública de apoiadores fictícios](docs/images/demo.png)

*Nome e apoiadores de demonstração, com dados fictícios.*

## O que ela faz

- **Uma página, com timeline pública** de quem apoiou, quanto e a mensagem que deixou.
- **Apoiar não exige cadastro**: valor, nome e mensagem (os dois opcionais), Pix. Acabou.
- **Anônimo de verdade**: quem não quer aparecer vira "Anônimo" + valor na vitrine.
  Nome e mensagem continuam no seu banco, visíveis só pra você.
- **Avatares gerados** ([DiceBear](https://www.dicebear.com)) a partir de um ID
  opaco — nunca do nome ou do e-mail de ninguém.
- **Uma página por projeto**: `/financeiro` mostra "Apoie Felipe no desenvolvimento
  do Financeiro"; a raiz aceita apoio genérico. Tudo cai na mesma timeline.
- **Link bonito ao compartilhar**: imagem de Open Graph gerada na hora, com o seu
  avatar e o seu nome.
- **Um admin pra configurar tudo** — identidade, projetos, valores sugeridos — e pra
  ver os apoios com nome e mensagem reais.

## Deploy

Só Docker. Não precisa clonar nada nem instalar Node.

```bash
docker run -d \
  --name apoia \
  --restart unless-stopped \
  -p 3000:3000 \
  -v apoia_data:/data \
  -e APOIA_SITE_URL="https://seu-dominio.com" \
  -e PIX_PROVIDER="woovi" \
  -e WOOVI_APP_ID="..." \
  -e APOIA_ADMIN_EMAIL="voce@gmail.com" \
  -e APOIA_ADMIN_SECRET="cole-aqui-o-segredo-gerado" \
  ghcr.io/valtlfelipe/apoia:latest
```

`APOIA_SITE_URL`, `WOOVI_APP_ID`, `APOIA_ADMIN_EMAIL` e `APOIA_ADMIN_SECRET` são o
mínimo obrigatório. `PIX_PROVIDER` já tem `woovi` como padrão e está aí só pra
deixar visível que o provedor de Pix é plugável — veja
[Adicionando outro provedor](#adicionando-outro-provedor-de-pix). As demais
opcionais estão em [Configuração](#configuração); se forem muitas, `--env-file .env`
no lugar dos vários `-e`.

Gere o segredo **uma vez** com `openssl rand -base64 32` e guarde: ele assina o
cookie de sessão, então trocar depois derruba o seu login no admin.

Depois acesse `https://seu-dominio.com/admin` e entre com a conta Google de
`APOIA_ADMIN_EMAIL` — é lá que você configura nome, avatar, links e projetos. Até o
primeiro login a instância roda com os padrões do código (nome "Apoia", sem
projetos).

Falta ainda [registrar o webhook da Woovi](#configurando-a-woovi), senão o
pagamento nunca confirma.

**Pra atualizar**, puxe a imagem nova e recrie o container — os dados ficam no
volume `apoia_data` e sobrevivem:

```bash
docker pull ghcr.io/valtlfelipe/apoia:latest
docker rm -f apoia
# rode o mesmo `docker run` de novo
```

As migrations do banco rodam sozinhas a cada boot, antes do servidor subir. Tags
publicadas a cada release: `latest`, `X.Y.Z`, `X.Y` e `X`; `edge` sai quando o
workflow é disparado manualmente a partir da `main`. Rodando um fork? A sua imagem
vai pra `ghcr.io/<seu-usuário>/<seu-fork>`.

## Configuração

Obrigatórias:

| Variável | Descrição |
|---|---|
| `APOIA_SITE_URL` | URL pública desta instância. Usada nos metadados, no registro do webhook e como origin do login. |
| `WOOVI_APP_ID` | App ID do painel da Woovi → *Applications*. **Nunca vai para o navegador.** |
| `APOIA_ADMIN_EMAIL` | A única conta Google que entra no `/admin`. |
| `APOIA_ADMIN_SECRET` | Assina o cookie de sessão do admin. Gere com `openssl rand -base64 32`. |

Opcionais:

| Variável | Padrão | Descrição |
|---|---|---|
| `APOIA_RATE_LIMIT_PER_MINUTE` | `5` | Cobranças criadas por IP, por minuto. |
| `DATABASE_PATH` | `/data/apoia.db` no Docker | Arquivo SQLite. |
| `PIX_PROVIDER` | `woovi` | Qual módulo de `lib/pix/providers` usar. |
| `WOOVI_API_URL` | `https://api.woovi.com/api/v1` | Sandbox: `api.woovi-sandbox.com`. |
| `WOOVI_WEBHOOK_TOKEN` | — | Token extra conferido no header `Authorization` do webhook. |
| `WOOVI_WEBHOOK_PUBLIC_KEY` | — | Sobrescreve a chave pública que valida a assinatura do webhook (rotação de chave, sandbox). |

Lista completa e comentada em [`.env.example`](.env.example). Todo o resto — nome,
avatar, links, projetos, valores sugeridos, mensagem de agradecimento — se
configura no [`/admin`](#admin), não por variável de ambiente.

## Configurando a Woovi

1. Crie uma conta em [woovi.com](https://woovi.com) e gere um **App ID** em
   *Applications*.
2. Passe em `WOOVI_APP_ID`.
3. Com a instância no ar numa URL HTTPS pública, registre o webhook apontando pra
   `$APOIA_SITE_URL/api/webhooks/woovi`:

   ```bash
   export WOOVI_APP_ID="..."                            # o mesmo do deploy
   export WOOVI_API_URL="https://api.woovi.com/api/v1"  # sandbox: api.woovi-sandbox.com
   export APOIA_SITE_URL="https://seu-dominio.com"

   for event in OPENPIX:CHARGE_COMPLETED OPENPIX:CHARGE_EXPIRED; do
     curl -X POST "$WOOVI_API_URL/webhook" \
       -H "Authorization: $WOOVI_APP_ID" \
       -H "Content-Type: application/json" \
       -d "{\"name\":\"apoia — $event\",\"event\":\"$event\",\"url\":\"$APOIA_SITE_URL/api/webhooks/woovi\",\"isActive\":true}"
   done
   ```

   Passo único por deploy — refaça só se `APOIA_SITE_URL` mudar. Dá pra fazer pelo
   painel da Woovi também; não existe script deste projeto que faça isso por você.

O webhook é a fonte de verdade da confirmação. A página também faz *polling* de
status como reforço, útil onde o webhook ainda não está configurado (dev local).

## Admin

Sem `APOIA_ADMIN_EMAIL`/`APOIA_ADMIN_SECRET` a instância nem sobe — é por ali que
se configura o site:

- **Configurações**: identidade do criador (nome, nome curto usado nas headlines,
  tagline, avatar, links) e o formulário de apoio (valores sugeridos, mínimo e
  máximo, o que a timeline mostra, estilo do avatar, validade da cobrança, mensagem
  de agradecimento).
- **Produtos**: criar, editar, ativar/desativar e — se ainda não tiver apoios —
  excluir as páginas `/<slug>`.
- **Apoios**: a lista com nome e mensagem **reais**, mesmo de quem escolheu aparecer
  como anônimo, com um botão pra ocultar (ou devolver) alguém da vitrine. Veja
  [Privacidade e segurança](#privacidade-e-segurança).
- **Sobre**: versão instalada, checagem de nova release e links pro repositório.

O login usa o Google via [shoo.dev](https://shoo.dev), um broker de autenticação
minimalista: ele confirma sua identidade e devolve um token assinado, que o apoia
verifica no servidor e só aceita se o e-mail bater com `APOIA_ADMIN_EMAIL`. A
sessão é um cookie próprio do apoia, independente do shoo.

## Privacidade e segurança

- **Nenhum dado pessoal é coletado** além do que a pessoa opcionalmente digita: nome
  e mensagem. Sem e-mail, CPF ou telefone.
- **Anônimo na vitrine, não no banco**: com "aparecer na timeline" desmarcado, nem a
  página nem a API pública devolvem o nome ou a mensagem reais — só "Anônimo" e o
  valor. O dado real fica no SQLite, visível só pelo `/admin`.
- **Payload do webhook é higienizado antes de salvar**: a Woovi manda nome e CPF de
  quem pagou no evento de confirmação; esse bloco é removido antes de qualquer
  persistência, inclusive do log de auditoria.
- **Assinatura do webhook é verificada** (RSA, chave pública da Woovi) antes de
  processar qualquer payload.
- **Rate limiting** por IP na criação de cobranças — o IP nunca é salvo, só um hash
  em memória que expira.
- **Headers de segurança** (CSP, HSTS, `X-Frame-Options`) por padrão em
  `next.config.ts`. `img-src` aceita qualquer origem `https:`, porque a URL do
  avatar é configurável em runtime; `script-src` continua travado em `'self'`.

## Desenvolvimento local

Pra mexer no código — não é necessário só pra hospedar. Requer Node.js 24+ e
[pnpm](https://pnpm.io).

```bash
git clone https://github.com/valtlfelipe/apoia.git
cd apoia
pnpm install
cp .env.example .env       # edite com seus dados
pnpm db:generate           # só na primeira vez, ou após mudar lib/db/schema.ts
pnpm db:migrate
pnpm dev
```

Sem um `WOOVI_APP_ID` de verdade a criação de cobrança falha (esperado), mas página,
timeline e validações funcionam normalmente com linhas inseridas direto no SQLite.
Testar a confirmação de ponta a ponta exige uma conta Woovi (sandbox serve) — sem
ela o webhook nunca chega, e a assinatura precisa bater com o payload real.

Pra testar mudanças no `Dockerfile`, o `docker-compose.yml` do repo builda local:
`docker compose up -d --build`.

| Comando | O que faz |
|---|---|
| `pnpm dev` | Servidor de desenvolvimento. |
| `pnpm build` / `pnpm start` | Build e start de produção. |
| `pnpm db:generate` | Gera uma migration a partir de `lib/db/schema.ts`. |
| `pnpm db:migrate` | Aplica as migrations pendentes. |
| `pnpm db:studio` | Abre o [Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview). |
| `pnpm check` | Lint (Biome) + typecheck. |

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Drizzle ORM · SQLite
(`better-sqlite3`) · Zod · TypeScript.

O driver do SQLite fica isolado em `lib/db/client.ts` — é o único arquivo que fala
com ele direto, então trocar por `node:sqlite` (nativo, ainda experimental) é mexer
só ali.

## Adicionando outro provedor de Pix

Toda a integração passa pela interface `PixProvider` (`lib/pix/types.ts`); nenhum
componente de UI ou lógica de domínio referencia um provedor específico. Pra
adicionar um:

1. Crie `lib/pix/providers/<nome>.ts` implementando `PixProvider` (`createCharge`,
   `getChargeStatus`, `verifyWebhook`, `parseWebhook`, `redactWebhookPayload`).
2. Registre em `lib/pix/index.ts`.
3. Adicione o nome ao enum `PIX_PROVIDER` em `lib/config/env.ts`.

## Publicando uma release

Pra quem mantém o projeto:

1. Mova as mudanças de `[Unreleased]` pra uma nova seção no
   [`CHANGELOG.md`](CHANGELOG.md), no formato `## [X.Y.Z] - AAAA-MM-DD`.
2. Atualize `"version"` no `package.json` pro mesmo número.
3. `git tag vX.Y.Z && git push origin main vX.Y.Z`

O workflow builda a imagem multi-arch (`linux/amd64` e `linux/arm64`), publica no
GHCR e cria a GitHub Release com as notas tiradas da seção correspondente do
changelog.

## Licença

AGPL-3.0-only.
