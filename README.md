# PowerPrompts

[![Build](https://img.shields.io/github/actions/workflow/status/PerkyZZ999/PowerPrompts/ci.yml?branch=main&label=build&logo=github)](https://github.com/PerkyZZ999/PowerPrompts/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Language: TypeScript](https://img.shields.io/github/languages/top/PerkyZZ999/PowerPrompts?logo=typescript)](https://github.com/PerkyZZ999/PowerPrompts)
[![Repo Size](https://img.shields.io/github/repo-size/PerkyZZ999/PowerPrompts)](https://github.com/PerkyZZ999/PowerPrompts)

Prompt optimizer that combines multiple prompt-engineering frameworks and advanced techniques to automatically improve prompts for reasoning, creative, and factual tasks.

Status: ✅ FULLY IMPLEMENTED — Ready for testing

---

## Table of Contents

- Features
- Supported Frameworks
- Core Techniques
- Optimization Techniques & Best Practices
- Architecture Overview
- Quickstart (npm / pnpm / bun)
- Environment
- API Endpoints (overview)
- Typical Pipeline
- Contributing
- License
- Maintainer

---

## Features

- Automated prompt optimization with multi-framework support.
- 5-iteration optimization loop with evaluation and recursive self-improvement.
- Synthetic dataset generation for few-shot evaluation.
- Streaming iteration updates (SSE) for frontend progress.
- RAG (Retrieval-Augmented Generation) support to reduce hallucinations.
- Built-in evaluation metrics: relevance, accuracy, consistency, efficiency, readability, user satisfaction.
- Export optimized prompts and version comparisons.

---

## Supported Frameworks

PowerPrompts implements four usable frameworks out of the box:

- RACE — Role, Action, Context, Expectations/Examples (default, general-purpose)
- COSTAR — Context, Objective, Style, Tone, Audience, Response (creative & content)
- APE — Action, Purpose, Expectation (fast, simple tasks)
- CREATE — Character, Request, Examples, Adjustments, Type, Extras (detailed/complex tasks)

---

## Core Techniques

PowerPrompts supports and composes many proven prompt-engineering techniques:

- Zero-Shot Prompting
- Few-Shot Prompting (auto-generate 2–5 examples)
- Chain-of-Thought (CoT)
- Self-Consistency (multiple reasoning paths + majority voting)
- Tree of Thoughts (ToT)
- Recursive Self-Improvement Prompting (RSIP)
- Retrieval-Augmented Generation (RAG)
- Prompt Chaining (breaking complex tasks into subtasks)

(These are selectable and combined automatically based on task type.)

---

## Optimization Techniques & Best Practices

Included optimizations used by PowerPrompts:

- Delimiters (XML tags, triple backticks, pipes) for structured prompts
- Parameter tuning (temperature, top_p) with sensible defaults
- Output format constraints (JSON schema, regex) to produce parseable outputs
- Negative prompting (specify what to avoid)
- Context window management (sliding windows, hierarchical summarization)
- Role prompting (persona/expertise definition)

---

## Architecture Overview

- Backend: Node.js + TypeScript, Fastify-based API
  - Core modules: llm-client (OpenAI/Anthropic wrappers), optimization-service, dataset-generator, evaluator, rag-service
  - Storage: sql.js (SQLite) for metadata, ChromaDB for vector store (RAG)
  - Validation: Zod schemas
  - Streaming: Server-Sent Events (SSE) for iteration updates

- Frontend: Next.js (TypeScript, App Router) + TailwindCSS
  - Key components: prompt input, framework selector, technique toggles, iteration progress, version comparison, metrics dashboard

Project layout (excerpt from plan):
- backend/
  - src/
- prompt-optimizer-frontend/
  - src/

---

## Quickstart (npm / pnpm / bun)

This repo contains a backend and frontend (see ProjectOverview.md). The commands below assume the directories `backend/` and `prompt-optimizer-frontend/` exist as described in the project plan.

Note: adjust paths/scripts if your package.json uses different names.

1) Clone
```bash
git clone https://github.com/PerkyZZ999/PowerPrompts.git
cd PowerPrompts
```

2) Install dependencies

- npm (recommended)
```bash
# Root (if monorepo bootstrap not used)
cd backend
npm install
# Start backend in dev
npm run dev

# In a separate terminal
cd ../prompt-optimizer-frontend
npm install
npm run dev
```

- pnpm
```bash
# Install pnpm if needed: npm i -g pnpm
cd backend
pnpm install
pnpm dev

# Frontend
cd ../prompt-optimizer-frontend
pnpm install
pnpm dev
```

- bun
```bash
# Install bun (https://bun.sh) then:
cd backend
bun install
bun run dev

# Frontend
cd ../prompt-optimizer-frontend
bun install
bun run dev
```

Typical npm scripts (if following the plan):
- backend: `dev` (Fastify server), `build`, `start`
- frontend: `dev` (Next.js), `build`, `start`

If the repository is structured as a single workspace/monorepo, run the root-level install first (`npm install` / `pnpm install` / `bun install`) and then run the workspace dev scripts.

---

## Environment Variables

Create a `.env` in backend (and frontend if needed). Typical variables:

- OPENAI_API_KEY — OpenAI API key
- ANTHROPIC_API_KEY — (optional) Claude/Anthropic key
- ARIZE_API_KEY — (optional) Arize integration
- DATABASE_URL — SQLite path or connection string
- VECTOR_DB_URL — vector DB connection (ChromaDB endpoint) if external
- BACKEND_URL — front-end → back-end base URL

Never commit secrets to git.

---

## API Endpoints (overview)

From the project plan — endpoints to expect:

- POST /api/optimize — main optimization endpoint (SSE streaming)
- GET /api/frameworks — list available frameworks
- GET /api/techniques — list supported techniques
- GET /api/versions/:promptId — version history
- POST /api/rag/upload — upload documents for RAG
- POST /api/rag/search — query RAG store
- POST /api/datasets/generate — synthetic dataset generation
- POST /api/evaluate — run evaluation/judge

Refer to the code for exact request/response schemas (Zod schemas are used for runtime validation).

---

## Typical 5-Iteration Pipeline

1. Framework selection & structuring (RACE/COSTAR/APE/CREATE)
2. Technique selection (auto-detect task type and enable CoT / ToT / Self-Consistency / RSIP / RAG as appropriate)
3. Synthetic dataset generation (10–20 inputs + expected outputs)
4. Iteration loop (execute -> evaluate -> collect feedback -> RSIP improve) × 5
5. Select best version, present side-by-side comparison and metrics, export

Results stream to the frontend via SSE and include metrics, critique, and improved prompts.

---

## Contributing

- Open issues for bugs, feature requests, or documentation improvements.
- Follow the existing TypeScript style and include tests where appropriate.
- Document new meta-prompts and evaluation criteria — these are critical to reproducible results.

---

## License

This project is licensed under the MIT License. See LICENSE for the full text.

---

Maintainer
- Charles W. — https://github.com/PerkyZZ999
