<!-- 4525de87-3302-49e6-b5a2-3b07ba92d5cb a2224df8-720c-40c6-9d00-f12a78620645 -->
# Node.js/TypeScript Backend Migration Plan

## Phase 1: Project Setup and Infrastructure (Days 1-2)

### Remove Old Backend

- Delete entire `backend/` directory
- Clean up any backend-related configuration files

### Initialize New Backend Structure

- Create new `backend/` directory with TypeScript/Node.js setup
- Initialize package.json with Fastify, TypeScript, and core dependencies:
  - **Framework**: `fastify` + `@fastify/cors` + `@fastify/multipart`
  - **TypeScript**: `typescript` + `@types/node` + `tsx` (for dev)
  - **Validation**: `zod` (equivalent to Pydantic)
  - **AI SDKs**: `openai` + `@anthropic-ai/sdk` (future)
  - **Database**: `better-sqlite3` + `@types/better-sqlite3`
  - **Vector Store**: `chromadb` (official Node.js client)
  - **Utilities**: `dotenv` + `nanoid` (IDs) + `date-fns`

### TypeScript Configuration

- Create `tsconfig.json` with strict mode enabled
- Configure path aliases (@/ for src/)
- Enable decorators and experimental features
- Set module resolution to `bundler` for modern imports

### Project Structure

```
backend/
├── src/
│   ├── server.ts              # Fastify app entry point
│   ├── config.ts              # Environment configuration
│   ├── api/
│   │   ├── routes/            # All API routes
│   │   │   ├── optimization.ts
│   │   │   ├── datasets.ts
│   │   │   ├── evaluation.ts
│   │   │   ├── frameworks.ts
│   │   │   ├── versions.ts
│   │   │   └── rag.ts
│   │   ├── schemas/           # Zod validation schemas
│   │   │   ├── prompt.ts
│   │   │   ├── dataset.ts
│   │   │   └── evaluation.ts
│   │   └── middleware/        # Auth, logging, etc.
│   │       └── auth.ts
│   ├── core/
│   │   ├── llm-client.ts      # OpenAI wrapper
│   │   └── vector-store.ts    # ChromaDB wrapper
│   ├── services/
│   │   ├── framework-builder.ts
│   │   ├── dataset-generator.ts
│   │   ├── evaluator.ts
│   │   ├── technique-applier.ts
│   │   ├── optimization-service.ts
│   │   └── rag-service.ts
│   ├── prompts/
│   │   ├── frameworks.ts      # Meta-prompts for framework builders
│   │   ├── dataset-generation.ts
│   │   ├── evaluation-prompts.ts
│   │   └── meta-optimizer.ts
│   ├── db/
│   │   ├── schema.sql
│   │   ├── database.ts        # SQLite connection
│   │   └── crud.ts            # CRUD operations
│   └── utils/
│       ├── streaming.ts       # SSE helpers
│       ├── validators.ts
│       └── delimiters.ts      # XML tag helpers
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

### Environment Configuration

- Create `.env.example` with all required variables
- Implement type-safe config loader using Zod
- Load OpenAI API key, database path, API keys, etc.

---

## Phase 2: Core Infrastructure (Days 3-4)

### Database Setup

- Implement SQLite database initialization
- Create schema with tables: prompts, versions, datasets, examples, documents
- Implement CRUD helpers with TypeScript types
- Add connection pooling and transaction support

### LLM Client Wrapper

- Create OpenAI client wrapper class
- Implement `complete()` method with retry logic (using exponential backoff)
- Implement `embed()` method for RAG embeddings
- Add token counting helper using `tiktoken`
- Comprehensive error handling for rate limits and API failures

### Vector Store Integration

- Initialize ChromaDB client (persistent mode)
- Create "knowledge_base" collection
- Implement `addDocuments()` with chunking and embedding
- Implement `retrieve()` for similarity search
- Handle connection errors gracefully

### Authentication Middleware

- Implement Fastify hook for API key validation
- Extract and validate `X-API-Key` header
- Return 401 for invalid/missing keys
- Exempt health check and docs routes

### SSE Streaming Infrastructure

- Create SSE event type definitions (TypeScript union types)
- Implement `createSSEStream()` helper for Fastify
- Create event queue with TypeScript generics
- Handle client disconnection and cleanup
- Test with mock events

---

## Phase 3: Framework Builders (Days 5-6)

### Framework Meta-Prompts

- Port all 4 framework meta-prompts to TypeScript constants:
  - RACE: Role, Action, Context, Expectation
  - COSTAR: Context, Objective, Style, Tone, Audience, Response
  - APE: Action, Purpose, Expectation
  - CREATE: Character, Request, Examples, Adjustments, Type, Extras

### Framework Builder Service

- Implement `FrameworkBuilder` class with methods:
  - `buildRace(prompt: string): Promise<string>`
  - `buildCostar(prompt: string): Promise<string>`
  - `buildApe(prompt: string): Promise<string>`
  - `buildCreate(prompt: string): Promise<string>`
- Each method uses LLM to analyze unstructured prompt
- Extract role, action, context from user input
- Generate XML-structured output
- Preserve framework structure in all modifications

### XML Delimiter Utilities

- Implement `wrapTag(tag: string, content: string): string`
- Implement `extractTag(xml: string, tag: string): string | null`
- Implement `validateXml(xml: string): boolean`
- Add section parsers for each framework

### Frameworks API Endpoint

- Implement `GET /api/frameworks` route
- Return FrameworkInfo array with metadata
- Include structure, use cases, complexity, best-for tags

---

## Phase 4: Dataset Generation and Evaluation (Days 7-8)

### Dataset Generator Service

- Port dataset generation meta-prompts
- Implement `DatasetGenerator` class:
  - `generate(prompt: string, config: DatasetConfig): Promise<Dataset>`
  - Analyze prompt domain and task type using LLM
  - Generate 15+ diverse examples (varying difficulty)
  - Generate expected outputs for each example
  - Define domain-specific evaluation criteria
  - Store in SQLite and return Dataset object

### Datasets API Endpoint

- Implement `POST /api/datasets/generate` route
- Accept DatasetConfig with example count, difficulty levels
- Call DatasetGenerator service
- Return Dataset with all examples and criteria

### Evaluator Service

- Port evaluation meta-prompts (LLM-as-judge)
- Implement `Evaluator` class with metric calculations:
  - `calculateRelevance()`: LLM-based alignment scoring
  - `calculateAccuracy()`: Compare output to expected using LLM
  - `calculateConsistency()`: Run multiple times, measure variance
  - `calculateEfficiency()`: Token count / prompt length ratio
  - `calculateReadability()`: GPT-based clarity scoring
  - `aggregateMetrics()`: Weighted average (configurable weights)

### Evaluation API Endpoint

- Implement `POST /api/evaluate` route
- Accept EvaluateRequest with prompt + dataset ID
- Execute prompt on all examples
- Calculate all 5 metrics
- Return EvaluationResult with per-example breakdown

---

## Phase 5: RSIP and Optimization Loop (Days 9-10)

### RSIP Meta-Optimizer

- Port RSIP meta-prompts (critique + improve)
- Implement `TechniqueApplier` class:
  - `applyRsip(prompt: string, metrics: Metrics): Promise<string>`
  - Generate critique identifying weaknesses
  - Generate improved prompt addressing critique
  - Preserve framework XML structure
  - Return improved version

### Optimization Service

- Implement `OptimizationService` class:
  - `optimize(request: OptimizeRequest, eventQueue: EventQueue): Promise<OptimizationComplete>`
- 5-iteration loop:

  1. Apply framework structure (iteration 0)
  2. Execute against dataset
  3. Calculate metrics via Evaluator
  4. Apply RSIP for improvement
  5. Store version in database
  6. Emit SSE events (iteration_start, iteration_complete, optimization_complete)

- Select best version by aggregate score
- Return complete results

### Optimization API Endpoint

- Implement `POST /api/optimize` route
- Accept OptimizeRequest with prompt, framework, techniques
- Generate dataset if not provided
- Create SSE stream
- Run optimization in background async task
- Stream events to frontend in real-time
- Handle errors and emit error events

---

## Phase 6: Advanced Techniques (Days 11-13)

### Chain-of-Thought (CoT)

- Extend `TechniqueApplier` class:
  - `applyChainOfThought(prompt: string): string`
  - Inject "Let's think step by step" reasoning
  - Add CoT section after objective in framework

### Self-Consistency

- Implement in `TechniqueApplier`:
  - `applySelfConsistency(prompt: string, paths: number): Promise<string>`
  - Generate 3-5 reasoning paths with varying temperature
  - Aggregate responses via majority voting
  - Return most common answer with confidence score

### Tree of Thoughts (ToT)

- Implement in `TechniqueApplier`:
  - `applyTreeOfThoughts(prompt: string, config: ToTConfig): Promise<ToTResult>`
  - Recursive branching with depth/breadth limits
  - Evaluate each branch with Evaluator
  - Backtrack if branch score below threshold
  - Select best path through tree
  - Return winning path and visualization data

### Retrieval-Augmented Generation (RAG)

- Implement `RAGService` class:
  - `addDocuments(docs: Document[]): Promise<string[]>`
    - Chunk documents (500 words with 50-word overlap)
    - Generate embeddings via OpenAI
    - Store in ChromaDB
  - `retrieve(query: string, topK: number): Promise<RetrievedDoc[]>`
    - Query ChromaDB for similar documents
    - Return top-k with scores and metadata
- Extend `TechniqueApplier`:
  - `applyRag(prompt: string, query: string): Promise<string>`
  - Retrieve relevant docs
  - Inject as `<context>` section in prompt
- Implement RAG API endpoints:
  - `POST /api/rag/upload`: Upload documents
  - `GET /api/rag/collections`: List collections
  - `GET /api/rag/search`: Search documents

### Prompt Chaining

- Implement in `TechniqueApplier`:
  - `applyPromptChaining(prompts: string[]): Promise<string[]>`
  - Execute prompts sequentially
  - Pass output of each as input to next
  - Return all intermediate results

### Techniques API Endpoint

- Implement `GET /api/techniques` route
- Return TechniqueInfo array with metadata
- Include compatibility matrix (ToT requires CoT, etc.)
- Parameter schemas for each technique

---

## Phase 7: Versions and Export (Day 14)

### Versions API Endpoints

- Implement `GET /api/versions/:id` route
- Fetch version from database by ID
- Return full version with prompt, metrics, techniques

- Implement `GET /api/versions/compare` route
- Accept two version IDs
- Return both versions with diff highlighting
- Calculate delta for each metric

- Implement `POST /api/export` route
- Accept export format (json, markdown, text)
- Accept include/exclude options
- Generate formatted output
- Return as downloadable file

---

## Phase 8: Integration and Testing (Days 15-16)

### Update Frontend API Client

- Update `frontend/lib/api-client.ts`:
  - Change base URL if needed (should still be localhost:8000)
  - Update types to match new Zod schemas (minor adjustments)
  - Ensure SSE client works with new event format (should be identical)
- Test all API endpoints from frontend

### End-to-End Testing

- Test full optimization flow:

  1. Enter prompt in frontend
  2. Select framework and techniques
  3. Start optimization
  4. Verify SSE events stream correctly
  5. Check 5 iterations complete
  6. Verify best version selected
  7. Test export functionality
  8. Test history persistence

### Error Handling

- Test error scenarios:
  - Invalid API key
  - OpenAI rate limit
  - Database connection failure
  - ChromaDB unavailable
  - SSE connection drop
- Verify graceful degradation and error messages

### Performance Optimization

- Add caching for framework/technique metadata
- Implement request queuing for OpenAI API
- Optimize database queries with indexes
- Profile and optimize hot paths

---

## Phase 9: Documentation and Polish (Day 17)

### Update Backend README

- Installation instructions for Node.js backend
- Environment setup (.env configuration)
- Available scripts (dev, build, start, test)
- API documentation (link to Fastify Swagger UI)
- Architecture overview

### Code Quality

- Add JSDoc comments to all public functions
- Ensure TypeScript strict mode passes
- Run linter (ESLint) and fix issues
- Format code with Prettier

### Final Testing

- Manual E2E test with real prompts
- Test all 4 frameworks
- Test all 6 techniques
- Verify metrics accuracy
- Check export in all formats

---

## Technical Stack Summary

**Backend Framework**: Fastify (high-performance Node.js framework)

**Language**: TypeScript (strict mode)

**Validation**: Zod (type-safe schemas)

**Database**: better-sqlite3 (embedded SQLite)

**Vector Store**: ChromaDB (official Node.js client)

**AI SDK**: OpenAI Node.js SDK

**Testing**: Vitest (unit tests)

**Observability**: None (skipped as requested)

**Key Dependencies**:

```json
{
  "fastify": "^4.25.0",
  "@fastify/cors": "^9.0.0",
  "zod": "^3.22.0",
  "openai": "^4.20.0",
  "chromadb": "^1.7.0",
  "better-sqlite3": "^9.2.0",
  "tiktoken": "^1.0.0",
  "nanoid": "^5.0.0",
  "dotenv": "^16.3.0",
  "typescript": "^5.3.0",
  "tsx": "^4.7.0"
}
```

---

## Migration Benefits

1. **Single Language**: Full-stack TypeScript consistency
2. **Performance**: Fastify is one of the fastest Node.js frameworks
3. **Type Safety**: End-to-end type checking from frontend to backend
4. **Simpler Deployment**: No Python virtual environments, just npm install
5. **Better DX**: No emoji encoding issues in Windows terminal
6. **Ecosystem**: Access to entire npm ecosystem
7. **Modern Tooling**: Better VS Code integration, faster HMR

---

## Estimated Timeline

- **Phase 1-2** (Setup + Infrastructure): 2 days
- **Phase 3-4** (Frameworks + Dataset): 2 days
- **Phase 5** (RSIP + Optimization): 2 days
- **Phase 6** (Advanced Techniques): 3 days
- **Phase 7** (Versions + Export): 1 day
- **Phase 8** (Integration + Testing): 2 days
- **Phase 9** (Documentation): 1 day

**Total**: ~13 days of focused development

---

## Success Criteria

- All 4 frameworks working (RACE, COSTAR, APE, CREATE)
- All 6 techniques working (CoT, Self-Consistency, ToT, RSIP, RAG, Prompt Chaining)
- 5-iteration optimization loop functional
- SSE streaming real-time updates
- All 5 metrics calculated accurately
- Export in 3 formats (JSON, Markdown, Text)
- Frontend-backend integration seamless
- No emoji encoding errors
- TypeScript strict mode passing
- All tests passing

### To-dos

- [ ] Delete existing Python backend directory and clean up configuration files
- [ ] Initialize Node.js/TypeScript project with Fastify and core dependencies
- [ ] Create complete project directory structure with all folders and base files
- [ ] Configure TypeScript, create .env.example, implement type-safe config loader
- [ ] Implement SQLite database with schema, CRUD operations, and TypeScript types
- [ ] Create OpenAI client wrapper with retry logic, token counting, and error handling
- [ ] Integrate ChromaDB for vector storage with add/retrieve methods
- [ ] Implement API key authentication middleware for Fastify
- [ ] Create SSE streaming infrastructure with event types and queue management
- [ ] Port all 4 framework meta-prompts (RACE, COSTAR, APE, CREATE) to TypeScript
- [ ] Implement FrameworkBuilder service with methods for all 4 frameworks
- [ ] Create XML delimiter utilities for tag wrapping and extraction
- [ ] Implement GET /api/frameworks endpoint returning framework metadata
- [ ] Implement DatasetGenerator service with example and criteria generation
- [ ] Implement POST /api/datasets/generate endpoint
- [ ] Implement Evaluator service with all 5 metric calculations
- [ ] Implement POST /api/evaluate endpoint
- [ ] Implement RSIP meta-optimizer in TechniqueApplier service
- [ ] Implement OptimizationService with complete 5-iteration optimization loop
- [ ] Implement POST /api/optimize endpoint with SSE streaming
- [ ] Implement Chain-of-Thought technique in TechniqueApplier
- [ ] Implement Self-Consistency technique with multiple reasoning paths
- [ ] Implement Tree of Thoughts with recursive branching and backtracking
- [ ] Implement RAGService with document chunking, embedding, and retrieval
- [ ] Implement RAG technique with context injection in TechniqueApplier
- [ ] Implement RAG API endpoints (upload, collections, search)
- [ ] Implement Prompt Chaining technique with sequential execution
- [ ] Implement GET /api/techniques endpoint with compatibility matrix
- [ ] Implement versions API endpoints (get, compare, export)
- [ ] Update frontend API client to work with new Node.js backend
- [ ] Perform end-to-end testing of full optimization flow
- [ ] Test error scenarios and verify graceful error handling
- [ ] Update README with Node.js installation and usage instructions
- [ ] Add JSDoc comments, run linter, format code, ensure strict TypeScript