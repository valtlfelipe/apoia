# Changelog

Todas as mudanças relevantes serão registradas aqui. O formato segue Keep a Changelog e o projeto pretende usar versionamento semântico.

## [Unreleased]

### Changed

- "Apoiar no GitHub Sponsors" no `/admin/about` virou **"Apoiar o projeto"**, apontando para a página de apoio do próprio apoia. O mesmo link vai no `.github/FUNDING.yml`, que é o botão "Sponsor" do repositório.

### Added

- Um "feito com apoia" discreto, centralizado no rodapé das páginas públicas, ligando para o repositório.

## [1.0.3] - 2026-09-04

### Fixed

- **A página não funcionava em produção.** A Content-Security-Policy fixava `script-src 'self'`, o que bloqueia os dois `<script>` inline que o Next emite em toda página (bootstrap e payload RSC). Sem eles o React não hidratava: formulário de apoio, seletor de valor, botão de tema, "carregar mais" e o modal do Pix ficavam todos mortos no site publicado — só o HTML do servidor aparecia. Em desenvolvimento não dava, porque a política de dev incluía `'unsafe-inline'`. A CSP agora sai de `proxy.ts` com um nonce por requisição, que o Next carimba sozinho nos próprios scripts.
- O login do admin devolvia o navegador para `https://0.0.0.0:8080/admin` atrás de um proxy reverso (Railway, Fly, nginx): três redirects montavam a URL a partir de `request.url`, que nesse caso é o endereço em que o container escuta, não o público. Agora saem de `APOIA_SITE_URL`, a mesma fonte que o `redirectUri` do OAuth já usava. O logout tinha o mesmo defeito.
- `interest-cohort` saiu do `Permissions-Policy` — o FLoC foi removido do Chrome, e a diretiva só rendia um aviso "Unrecognized feature" no console a cada page load.

## [1.0.2] - 2026-09-04

### Fixed

- O container não subia quando o volume era montado por bind mount — caso do Railway, do Fly e da maioria das plataformas. O volume chega pertencendo ao root, e o usuário `apoia` (sem privilégio) não conseguia criar o arquivo do SQLite: `SqliteError: unable to open database file` (`SQLITE_CANTOPEN`) a cada boot, em loop. Volume nomeado do Docker herda a ownership da imagem, então isso não aparecia em teste local. Agora o entrypoint começa como root só para ajustar a pasta montada e cai de volta para `apoia` (via `setpriv`) antes das migrations e do servidor — a app continua sem rodar como root. Quem sobe com `--user` explícito pula esse ajuste, como antes.

## [1.0.1] - 2026-09-04

### Added

- Ícone do projeto: um coração branco sobre um quadrado índigo. Vira o favicon (`app/icon.svg`), uma versão raster 180×180 em `/apple-icon` (pra home screen do iOS e pra qualquer lugar que só aceite URL de imagem — o ícone de um template do Railway, por exemplo) e o mark no header do `/admin` e na tela de login. Também vai um PNG 512×512 com fundo transparente em `docs/images/icon.png`, pra quando é preciso subir o arquivo em vez de apontar uma URL. O desenho fica em `lib/brand.ts`, importado por todos os usos menos o `icon.svg`, que precisa ser arquivo literal pela convenção do Next.
- Healthcheck em `/api/health`. Além de responder, ele toca o banco (`select 1`) — o que interessa detectar não é "o processo está de pé", é o container cujo volume `/data` não montou, que responde ping feliz e serve 500 em toda página. É o path pra apontar no healthcheck da plataforma (Railway, `HEALTHCHECK` do Docker, load balancer).

## [1.0.0] - 2026-09-04

### Added

- Painel `/admin`, com login via Google usando [shoo.dev](https://shoo.dev): cadastro de produtos (criar, editar, ativar/desativar, excluir), configurações de identidade do criador (nome, nome curto, tagline, avatar, links) e do formulário de apoio (valores sugeridos, mínimo/máximo, checkboxes da timeline, estilo do avatar, validade da cobrança), e uma tabela de apoios com nome e mensagem reais — inclusive de quem pediu para ficar anônimo na timeline pública — com um botão para ocultar (ou devolver) alguém da vitrine sem apagar o dado. É a única forma de configurar o site: `APOIA_ADMIN_EMAIL` + `APOIA_ADMIN_SECRET` são obrigatórias.
- Apoios agora guardam o end-to-end id (E2E ID) do Pix recebido via webhook — visível na tabela de `/admin/apoios`, com botão de copiar. Só o webhook consegue capturá-lo (a Woovi não devolve esse campo na consulta de status usada pelo polling de reforço), então fica em branco pros raros casos confirmados só por polling.
- SEO nas páginas públicas: `robots.txt` e `sitemap.xml` gerados em runtime (o sitemap lista os produtos ativos), título e descrição derivados do que está configurado no `/admin`, URL canônica por página, e imagem Open Graph 1200×630 gerada na hora — com o avatar e o nome do criador, e o nome do produto nas páginas de produto. O avatar é embutido na imagem com timeout e fallback pro avatar gerado, então um host de imagem fora do ar não derruba o card. O `/admin` fica fora do índice (`noindex` no HTML e `Disallow` no robots).
- Aba **Sobre** em `/admin/about`: versão instalada (baixada automaticamente na imagem a partir da tag da release — builds locais/manuais mostram "dev"), checagem de nova versão publicada no GitHub, e links para apoiar o projeto, ver o repositório, reportar bug ou sugerir funcionalidade. Templates de issue do GitHub (`bug_report.yml`, `feature_request.yml`) criados junto.

### Changed

- **BREAKING**: `APOIA_PRODUCTS` foi removida. Produtos agora são gerenciados pelo `/admin` e vivem no banco (tabela `products`), não mais no `.env`. Quem atualiza precisa recadastrar seus produtos pelo admin — a variável antiga é ignorada (com aviso no boot) em vez de causar erro.
- **BREAKING**: `APOIA_CREATOR_NAME`, `APOIA_CREATOR_SHORT_NAME`, `APOIA_CREATOR_TAGLINE`, `APOIA_CREATOR_AVATAR_URL` e `APOIA_CREATOR_LINKS` foram removidas. A identidade do criador agora é gerenciada pelo `/admin` e vive no banco (tabela `settings`), não mais no `.env`. Antes do primeiro login no admin, a instância roda com os padrões do código (nome "Apoia", sem tagline nem links, avatar gerado). As variáveis antigas são ignoradas (com aviso no boot) em vez de causar erro.
- **BREAKING**: `APOIA_AMOUNT_PRESETS`, `APOIA_MIN_AMOUNT_CENTS`, `APOIA_MAX_AMOUNT_CENTS`, `APOIA_DEFAULT_PUBLIC`, `APOIA_SHOW_TOTAL_COUNT`, `APOIA_SHOW_TOTAL_AMOUNT`, `APOIA_AVATAR_STYLE`, `APOIA_CHARGE_EXPIRES_IN` e `APOIA_THANK_YOU_MESSAGE` foram removidas. Esse grupo (valores sugeridos, mínimo/máximo, os checkboxes da timeline, estilo do avatar gerado, validade da cobrança Pix, mensagem de agradecimento do modal de sucesso) agora é gerenciado pelo `/admin` e vive no banco (mesma tabela `settings`). Antes do primeiro login no admin, a instância roda com os padrões do código (idênticos aos defaults antigos da ENV: presets R$5/15/25, mínimo R$1, máximo R$10.000, timeline pública marcada por padrão, contagem visível e total oculto, avatar "notionists", cobrança válida por 30 minutos, mensagem padrão em pt-BR). As variáveis antigas são ignoradas (com aviso no boot) em vez de causar erro. Só `APOIA_RATE_LIMIT_PER_MINUTE` continua no `.env`.
- **BREAKING**: `APOIA_ADMIN_EMAIL` e `APOIA_ADMIN_SECRET` agora são **obrigatórias** — eram opcionais (o admin ficava desligado, 404 em toda rota, sem elas). Como o `/admin` passou a ser a única forma de configurar identidade do criador, produtos e formulário de apoio, deixar essa dupla de fora não faz mais sentido: o boot recusa subir sem as duas.
- Identidade visual redesenhada: fundo cinza-neutro, cards brancos, Plus Jakarta Sans como fonte única e um acento índigo, no lugar do tema "papel" (creme, serifa Fraunces, textura pontilhada, botões-pílula). O `/admin` ganhou barra superior fixa com item ativo e um cabeçalho de página padrão; o campo de valor do formulário público virou um só, com os valores sugeridos como atalhos dentro dele (antes eram dois controles sincronizados por um modo "outro valor").
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
