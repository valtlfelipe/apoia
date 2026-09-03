# Changelog

Todas as mudanças relevantes serão registradas aqui. O formato segue Keep a Changelog e o projeto pretende usar versionamento semântico.

## [Unreleased]

## [0.1.0] - 2026-09-03

### Added

- Página única de apoio via Pix, com timeline pública e opção de apoio anônimo (nome e mensagem continuam salvos, mas só aparecem publicamente se a pessoa optar).
- Integração com a Woovi via uma interface `PixProvider` modular — trocar ou adicionar outro provedor é um arquivo novo em `lib/pix/providers`.
- Páginas de produto opcionais (`/<slug>`) com headline própria, além do apoio genérico na raiz.
- Avatares gerados via DiceBear a partir de um ID opaco, nunca do nome do apoiador.
- Tema claro/escuro/sistema, com botão de alternância.
- Docker multi-stage (`node:24-slim`, saída `standalone`), com migrations do Drizzle rodando automaticamente no boot.
