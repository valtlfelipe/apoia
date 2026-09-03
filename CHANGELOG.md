# Changelog

Todas as mudanças relevantes serão registradas aqui. O formato segue Keep a Changelog e o projeto pretende usar versionamento semântico.

## [Unreleased]

### Added

- Painel `/admin` opcional (desligado por padrão), com login via Google usando [shoo.dev](https://shoo.dev): cadastro de produtos (criar, editar, ativar/desativar, excluir), configurações de identidade do criador (nome, nome curto, tagline, avatar, links), e uma lista de apoios com nome e mensagem reais — inclusive de quem pediu para ficar anônimo na timeline pública — com um botão para ocultar (ou devolver) alguém da vitrine sem apagar o dado. Ligado por `APOIA_ADMIN_EMAIL` + `APOIA_ADMIN_SECRET`.

### Changed

- **BREAKING**: `APOIA_PRODUCTS` foi removida. Produtos agora são gerenciados pelo `/admin` e vivem no banco (tabela `products`), não mais no `.env`. Quem atualiza precisa recadastrar seus produtos pelo admin — a variável antiga é ignorada (com aviso no boot) em vez de causar erro.
- **BREAKING**: `APOIA_CREATOR_NAME`, `APOIA_CREATOR_SHORT_NAME`, `APOIA_CREATOR_TAGLINE`, `APOIA_CREATOR_AVATAR_URL` e `APOIA_CREATOR_LINKS` foram removidas. A identidade do criador agora é gerenciada pelo `/admin` e vive no banco (tabela `settings`), não mais no `.env`. Sem o admin habilitado, a instância roda com os padrões do código (nome "Apoia", sem tagline nem links, avatar gerado). As variáveis antigas são ignoradas (com aviso no boot) em vez de causar erro.
- O `img-src` do Content-Security-Policy passou de uma allowlist por origem (derivada de `APOIA_CREATOR_AVATAR_URL` no boot) para aceitar qualquer origem `https:` — necessário porque a URL do avatar agora é configurável em runtime pelo `/admin`, não mais fixada no boot. `script-src` continua travado em `'self'`; a aplicação não tem superfície de injeção de HTML.

## [0.1.0] - 2026-09-03

### Added

- Página única de apoio via Pix, com timeline pública e opção de apoio anônimo (nome e mensagem continuam salvos, mas só aparecem publicamente se a pessoa optar).
- Integração com a Woovi via uma interface `PixProvider` modular — trocar ou adicionar outro provedor é um arquivo novo em `lib/pix/providers`.
- Páginas de produto opcionais (`/<slug>`) com headline própria, além do apoio genérico na raiz.
- Avatares gerados via DiceBear a partir de um ID opaco, nunca do nome do apoiador.
- Tema claro/escuro/sistema, com botão de alternância.
- Docker multi-stage (`node:24-slim`, saída `standalone`), com migrations do Drizzle rodando automaticamente no boot.
