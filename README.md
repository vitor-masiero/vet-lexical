# VetLéxico — Glossário & Flashcards de Medicina Veterinária

Aplicativo web para estudar vocabulário técnico de veterinária: pesquise uma
palavra com IA, veja o significado e exemplos, salve no glossário e revise com
flashcards.

## ✨ Funcionalidades

- **Busca com IA**: definição + exemplos em contexto veterinário, com foco em
  português do Brasil.
- **Glossário**: salve, pesquise, edite e exclua as palavras aprendidas.
- **Flashcards**:
  - estudo com virada 3D, progresso e marcação "sei / não sei";
  - criação manual (frente/verso);
  - geração automática pela IA a partir de um assunto;
  - conversão de uma palavra do glossário em card.
- **UX**: mobile-first, navegação simples (3 áreas), feedback com toasts e
  estados de carregamento.

## 🧱 Stack

| Camada     | Tecnologia                                              |
| ---------- | ------------------------------------------------------- |
| Frontend   | Next.js 16 (App Router) + React 19 + TypeScript         |
| Estilo     | Tailwind CSS v4                                         |
| Banco      | PostgreSQL no [Neon](https://neon.tech)                 |
| ORM        | Prisma 7 (driver adapter `@prisma/adapter-neon`)        |
| Auth       | Conta única, JWT em cookie httpOnly (`jose` + `bcryptjs`) |
| IA         | [opencode Go](https://opencode.ai) — modelo `beam-free`  |
| Deploy     | [Vercel](https://vercel.com)                            |

## 🚀 Rodando localmente

### 1. Instale as dependências

```bash
pnpm install
```

### 2. Configure as variáveis de ambiente

Copie o modelo e preencha os valores:

```bash
cp .env.example .env
```

| Variável          | Descrição                                                        |
| ----------------- | ---------------------------------------------------------------- |
| `DATABASE_URL`    | Connection string do Neon (com `?sslmode=require`)               |
| `OPENCODE_API_KEY`| Chave pessoal criada em <https://opencode.ai/console>            |
| `AUTH_SECRET`     | Segredo aleatório (`openssl rand -base64 32`)                    |
| `SEED_EMAIL`      | E-mail da conta de acesso                                        |
| `SEED_PASSWORD`   | Senha da conta de acesso                                         |
| `AI_MODEL`        | (Opcional) sobrescreve o modelo padrão `beam-free`               |

### 3. Crie o schema no banco

```bash
pnpm db:push
# ou, para migrations versionadas:
# pnpm db:migrate
```

### 4. Crie a conta de acesso (seed)

```bash
pnpm db:seed
```

### 5. Inicie o app

```bash
pnpm dev
```

Acesse <http://localhost:3000> e entre com `SEED_EMAIL` / `SEED_PASSWORD`.

## ☁️ Deploy na Vercel

1. Envie o projeto para um repositório no GitHub.
2. Importe o repositório na Vercel.
3. Configure as variáveis de ambiente (`DATABASE_URL`, `OPENCODE_API_KEY`,
   `AUTH_SECRET`, `SEED_EMAIL`, `SEED_PASSWORD`).
4. O build padrão (`next build`) já roda `prisma generate` via `postinstall`.
5. Antes do primeiro acesso, aplique o schema no Neon e rode o seed
   (localmente, apontando para o banco de produção, ou via um step de CI):

   ```bash
   DATABASE_URL="<url-do-neon>" pnpm db:push
   DATABASE_URL="<url-do-neon>" pnpm db:seed
   ```

> Para evoluir o schema com segurança em produção, prefira migrations:
> `pnpm db:migrate` em desenvolvimento e `pnpm exec prisma migrate deploy` no
> deploy.

## 🤖 Integração com IA (opencode Go)

A chamada fica isolada em `lib/ai.ts`:

```
Endpoint : https://opencode.ai/inference/go/openai/v1/chat/completions
Modelo   : beam-free
Auth     : Authorization: Bearer <OPENCODE_API_KEY>
Headers  : x-opencode-session (por conversa) + User-Agent próprio
SDK      : @ai-sdk/openai-compatible
```

Para trocar de modelo/provedor, basta ajustar `lib/ai.ts` e a variável
`AI_MODEL`.

## 🗂️ Estrutura

```
app/
  login/                 → tela de login
  (app)/                 → área protegida (header + bottom nav)
    buscar/              → pesquisa com IA
    glossario/           → glossário
    flashcards/          → estudo, criação e gerenciamento
  api/                   → rotas de auth, palavras, glossário e flashcards
components/
  flashcards/            → card 3D, abas de estudo/criação/gerência
  app-nav.tsx, toast.tsx, modal.tsx, icons.tsx
lib/
  ai.ts                  → cliente e prompts da IA
  auth.ts                → sessão JWT
  prisma.ts              → Prisma + adapter Neon
  types.ts, client-api.ts
prisma/
  schema.prisma          → modelos User, GlossaryEntry, Flashcard
  seed.ts                → cria a conta única
```

## 📜 Scripts

| Script           | O que faz                                   |
| ---------------- | ------------------------------------------- |
| `pnpm dev`       | Ambiente de desenvolvimento                 |
| `pnpm build`     | Build de produção                           |
| `pnpm start`     | Sobe o build                                |
| `pnpm lint`      | ESLint                                      |
| `pnpm db:generate` | Gera o Prisma Client                      |
| `pnpm db:push`   | Sincroniza o schema com o banco             |
| `pnpm db:migrate`| Cria/aplica migrations (dev)                |
| `pnpm db:seed`   | Cria a conta de acesso                      |
| `pnpm db:studio` | Abre o Prisma Studio                        |

## ℹ️ Notas

- O `cacheComponents` do template Next foi desativado para manter o
  comportamento dinâmico padrão (rotas autenticadas e leituras de banco).
- A assinatura opencode Go é usada conforme a opção **A** combinada: chamadas
  leves de chat completion com os headers recomendados.
