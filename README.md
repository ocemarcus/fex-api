# Fex Protocol — API

API do **Fex Protocol**: protocolo de comunicação entre **PSPs (Payment Service Providers)**.

## Stack

- Node.js
- NestJS (TypeScript)
- PostgreSQL
- Drizzle ORM
- BiomeJS (lint/format)
- Vitest (testes)
- Swagger/OpenAPI
- JWT
- RSA (geração e validação de chaves criptográficas)

## Requisitos

- Node.js 20+
- PostgreSQL em execução

## Configuração

Copie `.env.example` para `.env` e ajuste os valores:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/fex
JWT_SECRET=change-me-to-a-long-random-secret
JWT_EXPIRES_IN=10000
PORT=3000
```

## Instalação

```bash
npm install
```

## Execução

```bash
# Migrations aplicadas automaticamente na inicialização (pasta drizzle/)
npm run dev        # modo desenvolvimento (watch)
npm start          # produção
```

Criar/atualizar migrations a partir do schema:

```bash
npm run db:generate   # gerar migration a partir do schema Drizzle
npm run db:push       # push direto do schema para o banco
```

## Scripts

| Script           | Descrição                            |
| ---------------- | ------------------------------------ |
| `npm run dev`    | Inicia o servidor em watch           |
| `npm start`      | Inicia o servidor                    |
| `npm run build`  | Compila o projeto                    |
| `npm run lint`   | Biome check                          |
| `npm run format` | Biome format (com escrita)           |
| `npm test`       | Vitest                               |

## Documentação (Swagger)

Com o servidor rodando, acesse:

```text
http://localhost:3000/docs
```

Autenticação via `Authorization: Bearer <jwt>`.

## Fluxo de autenticação

1. `POST /psp` — cria o PSP.
2. `POST /psp/api-key` — gera o par RSA e retorna `apiKey` + `privateKey` (retornada **somente aqui**).
3. `POST /psp/auth` — envia `apiKey` + `privateKey`, valida o par RSA e retorna o `jwt`.
4. Rotas protegidas usam `Authorization: Bearer <jwt>`. O `pspId` é obtido do token (nunca do request).

## Endpoints

| Método | Rota                 | Autenticação | Descrição                        |
| ------ | -------------------- | ------------ | -------------------------------- |
| POST   | `/psp`               | —            | Criar novo PSP                   |
| POST   | `/psp/api-key`       | —            | Criar API Key (par RSA)          |
| POST   | `/psp/auth`          | —            | Autenticar PSP (gera JWT)        |
| POST   | `/psp/key`           | JWT          | Criar chave de cliente           |
| GET    | `/psp/key/:key`      | JWT          | Consultar chave de cliente       |
| POST   | `/psp/transfer`      | JWT          | Enviar uma transferência         |
| PATCH  | `/psp/transfer/ack`  | JWT          | Confirmar uma transferência      |
| GET    | `/psp/transfer/:id`  | JWT          | Detalhes da transferência        |
| GET    | `/transfer`          | JWT          | Listar transferências (paginado) |

### Listar transferências

```text
/transfer?page=1&limit=20&status=OK&keyId=121212
```

`limit` máximo: `100`.

## Estrutura

```text
src/
├── modules/
│   ├── psp/
│   │   ├── controllers/
│   │   ├── use-cases/
│   │   ├── repositories/
│   │   ├── dto/
│   │   └── psp.module.ts
│   ├── psp-key/
│   │   ├── controllers/
│   │   ├── use-cases/
│   │   ├── repositories/
│   │   ├── dto/
│   │   └── psp-key.module.ts
│   └── transfer/
│       ├── controllers/
│       ├── use-cases/
│       ├── repositories/
│       ├── dto/
│       └── transfer.module.ts
├── shared/
│   ├── auth/          # JWT guard
│   ├── crypto/        # RSA
│   ├── database/      # Drizzle + migrations
│   └── errors/        # Tratamento de erros
├── app.module.ts
└── main.ts
drizzle/               # Migrations SQL
```

## Banco de dados

Schema Drizzle em `src/shared/database/schema.ts`. Migration inicial em `drizzle/0000_init.sql`, aplicada automaticamente na inicialização da aplicação.

Tabelas: `psp`, `psp_api_key`, `psp_key`, `transfer` + enum `transfer_status` (`OK`, `REJECT`).
