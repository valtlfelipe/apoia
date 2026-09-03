# Changelog

Todas as mudanças relevantes serão registradas aqui. O formato segue Keep a Changelog e o projeto pretende usar versionamento semântico.

## [Unreleased]

### Added

- Painel `/admin` opcional (desligado por padrão), com login via Google usando [shoo.dev](https://shoo.dev): cadastro de produtos (criar, editar, ativar/desativar, excluir) e uma lista de apoios com nome e mensagem reais — inclusive de quem pediu para ficar anônimo na timeline pública — com um botão para ocultar (ou devolver) alguém da vitrine sem apagar o dado. Ligado por `APOIA_ADMIN_EMAIL` + `APOIA_ADMIN_SECRET`.

### Changed

- **BREAKING**: `APOIA_PRODUCTS` foi removida. Produtos agora são gerenciados pelo `/admin` e vivem no banco (tabela `products`), não mais no `.env`. Quem atualiza precisa recadastrar seus produtos pelo admin — a variável antiga é ignorada (com aviso no boot) em vez de causar erro.

## [0.1.0] - 2026-09-03

### Added

- Página única de apoio via Pix, com timeline pública e opção de apoio anônimo (nome e mensagem continuam salvos, mas só aparecem publicamente se a pessoa optar).
- Integração com a Woovi via uma interface `PixProvider` modular — trocar ou adicionar outro provedor é um arquivo novo em `lib/pix/providers`.
- Páginas de produto opcionais (`/<slug>`) com headline própria, além do apoio genérico na raiz.
- Avatares gerados via DiceBear a partir de um ID opaco, nunca do nome do apoiador.
- Tema claro/escuro/sistema, com botão de alternância.
- Docker multi-stage (`node:24-slim`, saída `standalone`), com migrations do Drizzle rodando automaticamente no boot.
