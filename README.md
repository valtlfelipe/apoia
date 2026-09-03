# apoia

Uma página simples para receber apoio via Pix — pensada para quem mantém projetos
open source no Brasil. Inspirada no [Buy Me a Coffee](https://buymeacoffee.com), mas
focada no público brasileiro: **só Pix**, sem coletar e-mail, CPF ou telefone.

Self-hosted, open source. Um admin opcional (login com Google via
[shoo.dev](https://shoo.dev)) cuida da identidade do criador (nome, avatar, links),
produtos e apoios; sem ele, a instância roda com os padrões do código (nome "Apoia",
sem produtos). O resto — Pix, formulário, banco — continua configurável só por
variáveis de ambiente.

[![Release](https://github.com/valtlfelipe/apoia/actions/workflows/release.yml/badge.svg)](https://github.com/valtlfelipe/apoia/actions/workflows/release.yml)
[![Release](https://img.shields.io/github/v/release/valtlfelipe/apoia)](https://github.com/valtlfelipe/apoia/releases)
[![Licença](https://img.shields.io/badge/licença-AGPL--3.0-blue.svg)](LICENSE)

![Página de apoio via Pix com timeline pública de apoiadores fictícios](docs/images/demo.png)

*Nome e apoiadores de demonstração, com dados fictícios.*

## O que ela faz

- **Uma página, com timeline pública** de apoios, no estilo Buy Me a Coffee.
- **Apoio anônimo de verdade**: quem não quer aparecer é salvo como "Anônimo" +
  valor na timeline — nome e mensagem continuam privados no banco, nunca saem dele.
- **Avatares gerados** ([DiceBear](https://www.dicebear.com)), sem depender de nome
  ou e-mail — a semente é sempre um ID opaco, mesmo para apoios públicos.
- **Páginas de produto opcionais**: `/financeiro` mostra "Apoie Felipe no
  desenvolvimento do Financeiro"; a raiz aceita apoio genérico. Tudo cai na mesma
  timeline compartilhada. Gerenciadas pelo `/admin` (veja [Admin](#admin)).
- **Admin opcional**: cadastro de produtos e uma visão dos apoios com nome e
  mensagem reais — inclusive de quem pediu para ficar anônimo na timeline, com a
  opção de tirar (ou devolver) alguém da vitrine pública. Desligado por padrão.
- **Pix modular**: a integração com o provedor de pagamento é uma interface
  (`PixProvider`) — hoje só a [Woovi](https://woovi.com) está implementada, mas
  trocar (ou adicionar um segundo provedor) é escrever um arquivo novo.
- **SQLite + Drizzle ORM**: um arquivo, fácil de fazer backup, nenhuma query SQL
  crua na aplicação.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Drizzle ORM · SQLite
(`better-sqlite3`) · Zod · TypeScript.

## Deploy (self-host)

Não precisa clonar o repositório nem instalar Node — só Docker. A cada release,
o workflow em `.github/workflows/release.yml` builda a imagem (`linux/amd64` e
`linux/arm64`) e publica no GitHub Container Registry.

1. Crie uma pasta pra sua instância e, dentro dela, um `docker-compose.yml`:

   ```yaml
   services:
     apoia:
       image: ghcr.io/valtlfelipe/apoia:latest
       ports:
         - "3000:3000"
       env_file:
         - .env
       environment:
         DATABASE_PATH: /data/apoia.db
       volumes:
         - apoia-data:/data
       restart: unless-stopped

   volumes:
     apoia-data:
   ```

   (Rodando seu próprio fork? Troque `valtlfelipe/apoia` pelo seu — o release
   publica automaticamente em `ghcr.io/<seu-usuário>/<seu-fork>`.)

2. Crie o `.env` na mesma pasta, com base na seção [Configuração](#configuração-variáveis-de-ambiente)
   abaixo — no mínimo `APOIA_SITE_URL` e `WOOVI_APP_ID`. Seu nome, avatar e links
   não são mais variáveis de ambiente: sem o [`/admin`](#admin) habilitado, a
   instância sobe com os padrões do código (nome "Apoia").

3. Suba:

   ```bash
   docker compose pull
   docker compose up -d
   ```

As migrations do banco rodam automaticamente a cada boot do container, antes do
servidor subir (veja `docker-entrypoint.sh`) — não tem passo manual de migration
no deploy. Os dados ficam no volume nomeado `apoia-data`, sobrevivem a updates e
restarts.

Pra atualizar depois de uma nova release:

```bash
docker compose pull
docker compose up -d
```

Tags disponíveis: `latest` e `<major>.<minor>.<patch>` (ex.: `0.1.0`) a partir de
cada release marcada com uma tag `vX.Y.Z`; `edge` fica disponível quando o
workflow é disparado manualmente a partir da `main`.

## Configuração (variáveis de ambiente)

Tudo fica no `.env`. Veja `.env.example` para a lista completa comentada — aqui vai
o resumo:

### Site

| Variável | Obrigatória | Descrição |
|---|---|---|
| `APOIA_SITE_URL` | sim | URL pública desta instância (usada em metadata, no registro do webhook e como origin do login OAuth). |

> **Criador** (nome, avatar, tagline, links), **produtos** (`/financeiro`, headline,
> etc.) e **formulário de apoio** (valores, checkboxes da timeline, estilo do
> avatar, validade da cobrança) não são mais variáveis de ambiente — configure-os
> pelo [`/admin`](#admin). Sem admin habilitado, a instância roda com os padrões do
> código: nome "Apoia", avatar gerado, sem tagline nem links, só a página raiz com
> apoio genérico, valores sugeridos de R$5/15/25, mínimo R$1, máximo R$10.000.

### Formulário de apoio

| Variável | Padrão | Descrição |
|---|---|---|
| `APOIA_THANK_YOU_MESSAGE` | *(padrão em pt-BR)* | Mensagem no modal de sucesso após o pagamento confirmar. Aceita `{amount}`. |
| `APOIA_RATE_LIMIT_PER_MINUTE` | `5` | Limite de criação de cobranças por IP. |

### Pix

| Variável | Descrição |
|---|---|
| `PIX_PROVIDER` | Qual módulo em `lib/pix/providers` usar. Hoje: `woovi`. |
| `WOOVI_APP_ID` | App ID gerado no painel da Woovi → Applications. **Nunca vai para o navegador.** |
| `WOOVI_API_URL` | Padrão `https://api.woovi.com/api/v1`. |
| `WOOVI_WEBHOOK_TOKEN` | Opcional — token extra verificado no header `Authorization` do webhook. |
| `WOOVI_WEBHOOK_PUBLIC_KEY` | Opcional — sobrescreve a chave pública usada para validar a assinatura do webhook (rotação de chave / sandbox). |

### Banco de dados

`DATABASE_PATH` — caminho do arquivo SQLite (padrão `./data/apoia.db`; no Docker é
fixado em `/data/apoia.db`, dentro do volume).

### Admin (opcional)

| Variável | Descrição |
|---|---|
| `APOIA_ADMIN_EMAIL` | A única conta Google autorizada a entrar em `/admin`. |
| `APOIA_ADMIN_SECRET` | Assina o cookie de sessão do admin. Gere com `openssl rand -base64 32`. |

As duas juntas ligam o `/admin`; nenhuma das duas (o padrão) o desliga por completo —
toda rota sob `/admin` responde 404. Veja [Admin](#admin) abaixo.

## Configurando a Woovi

1. Crie uma conta em [woovi.com](https://woovi.com) e gere um **App ID** em
   *Applications* no painel.
2. Coloque em `WOOVI_APP_ID` no `.env`.
3. Depois do deploy (com `APOIA_SITE_URL` apontando para uma URL pública HTTPS),
   registre o webhook. Sem o repositório clonado, faça direto via `curl` —
   exporte suas variáveis e rode:

   ```bash
   export WOOVI_APP_ID="..."                        # o mesmo do .env
   export WOOVI_API_URL="https://api.woovi.com/api/v1"  # sandbox: api.woovi-sandbox.com
   export APOIA_SITE_URL="https://seu-dominio.com"

   for event in OPENPIX:CHARGE_COMPLETED OPENPIX:CHARGE_EXPIRED; do
     curl -X POST "$WOOVI_API_URL/webhook" \
       -H "Authorization: $WOOVI_APP_ID" \
       -H "Content-Type: application/json" \
       -d "{\"name\":\"apoia — $event\",\"event\":\"$event\",\"url\":\"$APOIA_SITE_URL/api/webhooks/woovi\",\"isActive\":true}"
   done
   ```

   Com o repositório clonado (desenvolvimento local), `pnpm pix:webhook` faz o
   mesmo a partir do `.env`.

O webhook é a fonte de verdade para confirmar pagamento — a página também faz
*polling* de status a cada poucos segundos como reforço, útil em ambientes onde o
webhook ainda não foi configurado (dev local, por exemplo).

### Testando sem uma conta Woovi

Para testar o fluxo de confirmação sem um pagamento Pix real:

1. Rode a app localmente e crie um apoio pelo formulário (vai falhar ao gerar a
   cobrança de verdade, mas isso não impede o teste abaixo).
2. Ou insira uma linha `pending` direto no SQLite para simular uma cobrança criada.
3. Com `APOIA_DEV_SKIP_WEBHOOK_SIGNATURE=true` no `.env` (**nunca em produção** — o
   boot recusa subir com essa flag e `NODE_ENV=production` juntas), rode:

   ```bash
   pnpm dev:webhook <id-do-apoio>
   ```

   Isso simula um evento `OPENPIX:CHARGE_COMPLETED` para aquele apoio, direto no seu
   servidor local.

## Admin

Desligado por padrão — sem `APOIA_ADMIN_EMAIL`/`APOIA_ADMIN_SECRET`, `/admin` não
existe (404 em qualquer rota sob ele), e a instância roda com os padrões do código
(nome "Apoia", sem produtos). Habilitado, dá acesso a:

- **Configurações**: identidade do criador (nome, nome curto usado nas headlines,
  tagline, URL do avatar, links) e o formulário de apoio (valores sugeridos,
  mínimo/máximo, os três checkboxes da timeline, estilo do avatar gerado, validade
  da cobrança Pix).
- **Produtos**: criar, editar, ativar/desativar e (se ainda não tiver apoios)
  excluir as páginas `/<slug>`.
- **Apoios**: uma lista com nome e mensagem **reais**, mesmo de quem marcou
  "aparecer como anônimo" na timeline pública — com um botão para ocultar (ou
  devolver) alguém da vitrine. Ver [Privacidade e segurança](#privacidade-e-segurança)
  abaixo.

O login usa o Google via [shoo.dev](https://shoo.dev), um broker de autenticação
minimalista: você clica em "Entrar com Google", ele confirma sua identidade e
devolve um token assinado — o apoia verifica esse token no servidor (nunca no
navegador) e só libera a sessão se o e-mail confirmado bater com
`APOIA_ADMIN_EMAIL`. A sessão em si é um cookie próprio do apoia, independente do
shoo.

> **shoo.dev está em estágio inicial** ("SUPER EARLY WIP" no próprio site) — é por
> isso que `APOIA_ADMIN_EMAIL`/`APOIA_ADMIN_SECRET` são uma segunda trava
> independente dele: mesmo que o shoo tenha um problema, só a conta exata que você
> configurou entra. Toda a integração vive em `lib/auth/shoo.ts` — trocar de
> provedor mais adiante é reescrever um arquivo, no mesmo espírito de
> [Adicionando outro provedor de Pix](#adicionando-outro-provedor-de-pix).

## Privacidade e segurança

- **Nenhum dado pessoal é coletado** além do que a pessoa opcionalmente digita: nome
  e mensagem. Sem e-mail, CPF ou telefone.
- **Anônimo na vitrine pública, não no banco**: se a pessoa desmarcar "aparecer na
  timeline", a API pública (`/api/timeline` e a própria página) nunca retorna o
  nome ou a mensagem reais — só "Anônimo" e o valor. Os dados reais ficam no
  SQLite e, se o `/admin` estiver habilitado, são visíveis só para
  `APOIA_ADMIN_EMAIL` — nunca pela API pública.
- **Payload do webhook é higienizado antes de salvar**: a Woovi manda o nome e o
  CPF de quem pagou dentro do evento de confirmação — esse bloco é removido antes
  de qualquer persistência, inclusive do log de auditoria (`webhook_events`).
- **Assinatura do webhook é verificada** (RSA, chave pública da Woovi) antes de
  processar qualquer payload.
- **Rate limiting** por IP na criação de cobranças (o IP em si nunca é salvo — só
  um hash em memória, que expira).
- Headers de segurança (CSP, HSTS, `X-Frame-Options`, etc.) configurados por padrão
  em `next.config.ts`. O `img-src` aceita qualquer origem `https:` — necessário
  porque a URL do avatar do criador agora é configurável em runtime (pelo
  `/admin`), não mais fixada no boot — mas `script-src` continua travado em
  `'self'` e não existe superfície de injeção de HTML na aplicação (nenhum
  `dangerouslySetInnerHTML`), então isso não abre caminho pra script malicioso.

Sem `/admin` habilitado, não existe nenhuma forma de ver, pela aplicação, o
nome/mensagem de quem pediu para ficar anônimo — os dados continuam no SQLite, mas
sem CLI nem rota que os exponha.

## Desenvolvimento local

Pra mexer no código (não necessário só pra hospedar). Requer Node.js 24+ e
[pnpm](https://pnpm.io).

```bash
git clone https://github.com/valtlfelipe/apoia.git
cd apoia
pnpm install
cp .env.example .env      # edite com seus dados (veja a seção de ENVs acima)
pnpm db:generate           # só na primeira vez, ou após mudar lib/db/schema.ts
pnpm db:migrate
pnpm dev
```

Abra http://localhost:3000.

Sem um `WOOVI_APP_ID` de verdade, o formulário de apoio vai falhar ao criar a
cobrança (esperado) — mas a página, a timeline e as validações funcionam normalmente
com dados de teste inseridos direto no SQLite. Veja [Testando sem uma conta Woovi](#testando-sem-uma-conta-woovi)
acima.

Pra buildar a imagem localmente em vez de usar a publicada (útil testando
mudanças no `Dockerfile`):

```bash
docker compose up -d --build
```

## Adicionando outro provedor de Pix

Toda a integração de pagamento passa pela interface `PixProvider`
(`lib/pix/types.ts`). Para adicionar um novo provedor:

1. Crie `lib/pix/providers/<nome>.ts` implementando `PixProvider`
   (`createCharge`, `getChargeStatus`, `verifyWebhook`, `parseWebhook`,
   `redactWebhookPayload`).
2. Registre em `lib/pix/index.ts`.
3. Adicione o nome ao enum `PIX_PROVIDER` em `lib/config/env.ts`.

Nenhum componente de UI ou lógica de domínio referencia um provedor específico —
só o registry.

## Trocando o driver de SQLite

Por padrão a app usa `better-sqlite3` (via `serverExternalPackages` no
`next.config.ts`, para o Docker copiar o binário nativo certo). Para usar o driver
nativo do Node (`node:sqlite` — zero dependências nativas, mas ainda experimental),
troque a implementação em `lib/db/client.ts`: é o único lugar que fala diretamente
com o driver — o resto da aplicação só usa o query builder do Drizzle.

## Publicando uma release

Pra quem mantém o projeto (não necessário só pra hospedar):

1. Mova as mudanças relevantes de `[Unreleased]` para uma nova seção no
   [`CHANGELOG.md`](CHANGELOG.md), no formato `## [X.Y.Z] - AAAA-MM-DD`.
2. Atualize `"version"` em `package.json` pro mesmo número.
3. Marque e envie a tag:

   ```bash
   git tag vX.Y.Z
   git push origin main vX.Y.Z
   ```

O workflow `.github/workflows/release.yml` builda a imagem multi-arch, publica
no GHCR com as tags `latest`, `X.Y.Z`, `X.Y` e `X`, e cria a GitHub Release com
as notas tiradas direto da seção correspondente do changelog.

## Scripts

| Comando | O que faz |
|---|---|
| `pnpm dev` | Servidor de desenvolvimento. |
| `pnpm build` / `pnpm start` | Build e start de produção. |
| `pnpm db:generate` | Gera uma migration a partir de `lib/db/schema.ts`. |
| `pnpm db:migrate` | Aplica as migrations pendentes. |
| `pnpm db:studio` | Abre o [Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview) para inspecionar o banco. |
| `pnpm pix:webhook` | Registra o webhook no provedor de Pix ativo. |
| `pnpm dev:webhook <id>` | Simula a confirmação de pagamento de um apoio local. |
| `pnpm check` | Lint (Biome) + typecheck. |

## Licença

AGPL-3.0-only.
