# apoia

Uma página simples para receber apoio via Pix — pensada para quem mantém projetos
open source no Brasil. Inspirada no [Buy Me a Coffee](https://buymeacoffee.com), mas
focada no público brasileiro: **só Pix**, sem coletar e-mail, CPF ou telefone.

Self-hosted, open source, configurável só por variáveis de ambiente. Sem painel de
admin, sem login — tudo em uma página só.

## O que ela faz

- **Uma página, com timeline pública** de apoios, no estilo Buy Me a Coffee.
- **Apoio anônimo de verdade**: quem não quer aparecer é salvo como "Anônimo" +
  valor na timeline — nome e mensagem continuam privados no banco, nunca saem dele.
- **Avatares gerados** ([DiceBear](https://www.dicebear.com)), sem depender de nome
  ou e-mail — a semente é sempre um ID opaco, mesmo para apoios públicos.
- **Páginas de produto opcionais**: `/financeiro` mostra "Apoie Felipe no
  desenvolvimento do Financeiro"; a raiz aceita apoio genérico. Tudo cai na mesma
  timeline compartilhada.
- **Pix modular**: a integração com o provedor de pagamento é uma interface
  (`PixProvider`) — hoje só a [Woovi](https://woovi.com) está implementada, mas
  trocar (ou adicionar um segundo provedor) é escrever um arquivo novo.
- **SQLite + Drizzle ORM**: um arquivo, fácil de fazer backup, nenhuma query SQL
  crua na aplicação.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Drizzle ORM · SQLite
(`better-sqlite3`) · Zod · TypeScript.

## Rodando localmente

Requer Node.js 24+ e [pnpm](https://pnpm.io).

```bash
pnpm install
cp .env.example .env      # edite com seus dados (veja a seção de ENVs abaixo)
pnpm db:generate           # só na primeira vez, ou após mudar lib/db/schema.ts
pnpm db:migrate
pnpm dev
```

Abra http://localhost:3000.

Sem um `WOOVI_APP_ID` de verdade, o formulário de apoio vai falhar ao criar a
cobrança (esperado) — mas a página, a timeline e as validações funcionam normalmente
com dados de teste inseridos direto no SQLite. Veja [Testando sem uma conta Woovi](#testando-sem-uma-conta-woovi)
abaixo.

## Deploy com Docker

```bash
cp .env.example .env      # edite com seus dados
docker compose up -d --build
```

O `docker-entrypoint.sh` roda as migrations automaticamente a cada boot, antes de
subir o servidor. Os dados ficam no volume nomeado `apoia-data` (mapeado para
`/data` dentro do container) — sobrevivem a rebuilds e restarts.

Para atualizar depois de um `git pull`:

```bash
docker compose up -d --build
```

## Configuração (variáveis de ambiente)

Tudo fica no `.env`. Veja `.env.example` para a lista completa comentada — aqui vai
o resumo:

### Criador

| Variável | Obrigatória | Descrição |
|---|---|---|
| `APOIA_CREATOR_NAME` | sim | Nome completo, mostrado no cabeçalho e na aba do navegador. |
| `APOIA_CREATOR_SHORT_NAME` | não | Versão curta usada nos títulos ("Apoie {curto} no desenvolvimento do X"). Padrão: primeiro nome de `APOIA_CREATOR_NAME`. |
| `APOIA_CREATOR_TAGLINE` | não | Frase curta abaixo do nome. |
| `APOIA_CREATOR_AVATAR_URL` | não | URL de uma imagem própria. Vazio = avatar gerado via DiceBear a partir do nome. A origem dessa URL é liberada automaticamente no `img-src` do CSP. |
| `APOIA_CREATOR_LINKS` | não | JSON `[{"label","url"}]` — links mostrados no topo. |
| `APOIA_SITE_URL` | sim | URL pública desta instância (usada em metadata e no registro do webhook). |

### Produtos (opcional)

`APOIA_PRODUCTS` é um array JSON de `{ slug, name, headline?, description? }`. Cada
produto ganha uma rota `/<slug>` com headline própria (aceita `{creator}` — o nome
curto, `{creatorFullName}` e `{product}` como placeholders). Deixe `"[]"` para só
ter apoio genérico na raiz.

```env
APOIA_PRODUCTS='[{"slug":"financeiro","name":"Financeiro","headline":"Apoie {creator} no desenvolvimento do {product}"}]'
```

### Formulário de apoio

| Variável | Padrão | Descrição |
|---|---|---|
| `APOIA_AMOUNT_PRESETS` | `500,1500,2500` | Valores sugeridos, em centavos. |
| `APOIA_MIN_AMOUNT_CENTS` | `100` | Mínimo por apoio (R$ 1,00). |
| `APOIA_MAX_AMOUNT_CENTS` | `1000000` | Máximo por apoio. |
| `APOIA_DEFAULT_PUBLIC` | `true` | Se o checkbox "aparecer na timeline" começa marcado. |
| `APOIA_SHOW_TOTAL_COUNT` | `true` | Mostrar o número de apoios na timeline. |
| `APOIA_SHOW_TOTAL_AMOUNT` | `false` | Mostrar a soma total arrecadada — decisão de quem hospeda. |
| `APOIA_AVATAR_STYLE` | `notionists` | Qualquer estilo do [`@dicebear/collection`](https://www.dicebear.com/styles/). |
| `APOIA_THANK_YOU_MESSAGE` | *(padrão em pt-BR)* | Mensagem no modal de sucesso após o pagamento confirmar. Aceita `{amount}`. |
| `APOIA_CHARGE_EXPIRES_IN` | `1800` | Validade da cobrança Pix, em segundos. |
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

## Configurando a Woovi

1. Crie uma conta em [woovi.com](https://woovi.com) e gere um **App ID** em
   *Applications* no painel.
2. Coloque em `WOOVI_APP_ID` no `.env`.
3. Depois do deploy (com `APOIA_SITE_URL` apontando para uma URL pública HTTPS),
   registre o webhook:

   ```bash
   pnpm pix:webhook
   ```

   Isso cadastra `OPENPIX:CHARGE_COMPLETED` e `OPENPIX:CHARGE_EXPIRED` apontando
   para `<APOIA_SITE_URL>/api/webhooks/woovi`.

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

## Privacidade e segurança

- **Nenhum dado pessoal é coletado** além do que a pessoa opcionalmente digita: nome
  e mensagem. Sem e-mail, CPF ou telefone.
- **Anônimo é anônimo de verdade**: se a pessoa desmarcar "aparecer na timeline", a
  API pública (`/api/timeline` e a própria página) nunca retorna o nome ou a
  mensagem reais — só "Anônimo" e o valor. Os dados reais ficam apenas no SQLite,
  visível só para quem tem acesso ao servidor.
- **Payload do webhook é higienizado antes de salvar**: a Woovi manda o nome e o
  CPF de quem pagou dentro do evento de confirmação — esse bloco é removido antes
  de qualquer persistência, inclusive do log de auditoria (`webhook_events`).
- **Assinatura do webhook é verificada** (RSA, chave pública da Woovi) antes de
  processar qualquer payload.
- **Rate limiting** por IP na criação de cobranças (o IP em si nunca é salvo — só
  um hash em memória, que expira).
- Headers de segurança (CSP, HSTS, `X-Frame-Options`, etc.) configurados por padrão
  em `next.config.ts`.

Hoje não existe uma forma de ver, pela própria aplicação, o nome/mensagem de quem
pediu para ficar anônimo — os dados estão no SQLite, mas não há CLI nem rota para
consultá-los. É proposital: essa parte foi deixada de fora para ser desenhada com
mais cuidado depois.

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

MIT.
