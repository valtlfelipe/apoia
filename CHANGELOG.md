# Changelog

Todas as mudanças relevantes serão registradas aqui. O formato segue Keep a Changelog e o projeto pretende usar versionamento semântico.

## [Unreleased]

### Added

- Painel `/admin`, com login via Google usando [shoo.dev](https://shoo.dev): cadastro de produtos (criar, editar, ativar/desativar, excluir), configurações de identidade do criador (nome, nome curto, tagline, avatar, links) e do formulário de apoio (valores sugeridos, mínimo/máximo, checkboxes da timeline, estilo do avatar, validade da cobrança), e uma tabela de apoios com nome e mensagem reais — inclusive de quem pediu para ficar anônimo na timeline pública — com um botão para ocultar (ou devolver) alguém da vitrine sem apagar o dado. É a única forma de configurar o site: `APOIA_ADMIN_EMAIL` + `APOIA_ADMIN_SECRET` são obrigatórias.
- Apoios agora guardam o end-to-end id (E2E ID) do Pix recebido via webhook — visível na tabela de `/admin/apoios`, com botão de copiar. Só o webhook consegue capturá-lo (a Woovi não devolve esse campo na consulta de status usada pelo polling de reforço), então fica em branco pros raros casos confirmados só por polling.

### Changed

- **BREAKING**: `APOIA_PRODUCTS` foi removida. Produtos agora são gerenciados pelo `/admin` e vivem no banco (tabela `products`), não mais no `.env`. Quem atualiza precisa recadastrar seus produtos pelo admin — a variável antiga é ignorada (com aviso no boot) em vez de causar erro.
- **BREAKING**: `APOIA_CREATOR_NAME`, `APOIA_CREATOR_SHORT_NAME`, `APOIA_CREATOR_TAGLINE`, `APOIA_CREATOR_AVATAR_URL` e `APOIA_CREATOR_LINKS` foram removidas. A identidade do criador agora é gerenciada pelo `/admin` e vive no banco (tabela `settings`), não mais no `.env`. Antes do primeiro login no admin, a instância roda com os padrões do código (nome "Apoia", sem tagline nem links, avatar gerado). As variáveis antigas são ignoradas (com aviso no boot) em vez de causar erro.
- **BREAKING**: `APOIA_AMOUNT_PRESETS`, `APOIA_MIN_AMOUNT_CENTS`, `APOIA_MAX_AMOUNT_CENTS`, `APOIA_DEFAULT_PUBLIC`, `APOIA_SHOW_TOTAL_COUNT`, `APOIA_SHOW_TOTAL_AMOUNT`, `APOIA_AVATAR_STYLE`, `APOIA_CHARGE_EXPIRES_IN` e `APOIA_THANK_YOU_MESSAGE` foram removidas. Esse grupo (valores sugeridos, mínimo/máximo, os checkboxes da timeline, estilo do avatar gerado, validade da cobrança Pix, mensagem de agradecimento do modal de sucesso) agora é gerenciado pelo `/admin` e vive no banco (mesma tabela `settings`). Antes do primeiro login no admin, a instância roda com os padrões do código (idênticos aos defaults antigos da ENV: presets R$5/15/25, mínimo R$1, máximo R$10.000, timeline pública marcada por padrão, contagem visível e total oculto, avatar "notionists", cobrança válida por 30 minutos, mensagem padrão em pt-BR). As variáveis antigas são ignoradas (com aviso no boot) em vez de causar erro. Só `APOIA_RATE_LIMIT_PER_MINUTE` continua no `.env`.
- **BREAKING**: `APOIA_ADMIN_EMAIL` e `APOIA_ADMIN_SECRET` agora são **obrigatórias** — eram opcionais (o admin ficava desligado, 404 em toda rota, sem elas). Como o `/admin` passou a ser a única forma de configurar identidade do criador, produtos e formulário de apoio, deixar essa dupla de fora não faz mais sentido: o boot recusa subir sem as duas.
- O `img-src` do Content-Security-Policy passou de uma allowlist por origem (derivada de `APOIA_CREATOR_AVATAR_URL` no boot) para aceitar qualquer origem `https:` — necessário porque a URL do avatar agora é configurável em runtime pelo `/admin`, não mais fixada no boot. `script-src` continua travado em `'self'`; a aplicação não tem superfície de injeção de HTML.

### Removed

- **BREAKING**: `APOIA_DEV_SKIP_WEBHOOK_SIGNATURE` foi removida — não há mais como pular a verificação de assinatura do webhook. Junto foram embora `pnpm dev:webhook` (simulava uma confirmação de pagamento local, e só existia pra contornar a assinatura) e `pnpm pix:webhook` (registrava o webhook na Woovi via API — específico do provedor). O registro do webhook continua documentado no README, direto via `curl`/painel da Woovi.

## [0.1.0] - 2026-09-03

### Added

- Página única de apoio via Pix, com timeline pública e opção de apoio anônimo (nome e mensagem continuam salvos, mas só aparecem publicamente se a pessoa optar).
- Integração com a Woovi via uma interface `PixProvider` modular — trocar ou adicionar outro provedor é um arquivo novo em `lib/pix/providers`.
- Páginas de produto opcionais (`/<slug>`) com headline própria, além do apoio genérico na raiz.
- Avatares gerados via DiceBear a partir de um ID opaco, nunca do nome do apoiador.
- Tema claro/escuro/sistema, com botão de alternância.
- Docker multi-stage (`node:24-slim`, saída `standalone`), com migrations do Drizzle rodando automaticamente no boot.
