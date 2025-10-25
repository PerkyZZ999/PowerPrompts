# Task Breakdown - PowerPrompts

**Version:** 1.0  
**Date:** October 19, 2025  
**Status:** Planning Phase

## Introduction

This document provides a granular task breakdown organized by feature area, with specific file paths, implementation notes, and acceptance criteria. Use this as a development checklist alongside the roadmap.

---

## 1. Backend Infrastructure Tasks

### 1.1 Project Setup

**Task:** Initialize Python project structure

- **Files:** `backend/`, `requirements.txt`, `.env.example`, `.gitignore`
- **Steps:**
  1. Create `backend/` directory
  2. Create `requirements.txt` with all dependencies
  3. Create `.env.example` with template configuration
  4. Create `.gitignore` (exclude `venv/`, `.env`, `__pycache__/`, `*.db`, `.chroma/`)
- **Acceptance:** `pip install -r requirements.txt` succeeds, env vars documented

**Task:** Create configuration module

- **File:** `backend/app/config.py`
- **Implementation:**

  ```python
  from pydantic_settings import BaseSettings
  from functools import lru_cache

  class Settings(BaseSettings):
      # API Keys
      openai_api_key: str
      api_key: str  # For backend auth

      # Database
      database_url: str = "sqlite:///./powerprompts.db"

      # ChromaDB
      chromadb_persist_directory: str = "./.chroma"

      # Arize Phoenix
      phoenix_enabled: bool = True
      phoenix_url: str = "http://localhost:6006"

      # App Config
      app_name: str = "PowerPrompts"
      app_version: str = "1.0.0"

      class Config:
          env_file = ".env"

  @lru_cache()
  def get_settings() -> Settings:
      return Settings()
  ```

- **Acceptance:** Environment variables load correctly, config accessible via `get_settings()`

**Task:** Create main FastAPI application

- **File:** `backend/app/main.py`
- **Implementation:**

  ```python
  from fastapi import FastAPI
  from fastapi.middleware.cors import CORSMiddleware
  from app.api.routes import optimization, datasets, evaluation, frameworks, versions
  from app.config import get_settings

  settings = get_settings()

  app = FastAPI(
      title=settings.app_name,
      version=settings.app_version,
      docs_url="/docs",
      redoc_url="/redoc"
  )

  # CORS for local frontend
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["http://localhost:3000"],
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )

  # Include routers
  app.include_router(optimization.router, prefix="/api", tags=["optimization"])
  app.include_router(datasets.router, prefix="/api/datasets", tags=["datasets"])
  app.include_router(evaluation.router, prefix="/api", tags=["evaluation"])
  app.include_router(frameworks.router, prefix="/api", tags=["frameworks"])
  app.include_router(versions.router, prefix="/api", tags=["versions"])

  @app.get("/health")
  async def health_check():
      return {"status": "healthy"}

  if __name__ == "__main__":
      import uvicorn
      uvicorn.run(app, host="0.0.0.0", port=8000)
  ```

- **Acceptance:** Server starts on port 8000, /health returns 200 OK, /docs shows API documentation

### 1.2 Database Setup

**Task:** Create SQLite schema

- **File:** `backend/app/db/schema.sql`
- **Implementation:** Copy schema from Data Models document (04-data-models.md)
- **Acceptance:** Schema file contains all tables with correct columns and constraints

**Task:** Implement database module

- **File:** `backend/app/db/database.py`
- **Implementation:**

  ```python
  import aiosqlite
  from contextlib import asynccontextmanager
  from app.config import get_settings

  settings = get_settings()

  @asynccontextmanager
  async def get_db():
      async with aiosqlite.connect(settings.database_url.replace("sqlite:///", "")) as db:
          db.row_factory = aiosqlite.Row
          yield db

  async def init_db():
      """Initialize database schema."""
      async with get_db() as db:
          with open("app/db/schema.sql") as f:
              await db.executescript(f.read())
          await db.commit()
  ```

- **Acceptance:** Database file created, tables initialized, queries work

**Task:** Create CRUD helpers

- **File:** `backend/app/db/crud.py`
- **Functions:**
  - `create_prompt(prompt: str, framework: str) -> str` (returns prompt_id)
  - `create_version(prompt_id, iteration, prompt_text, critique, metrics, ...) -> str`
  - `get_prompt(prompt_id: str) -> dict`
  - `get_versions(prompt_id: str) -> list[dict]`
  - `create_dataset(examples, criteria) -> str`
  - `get_dataset(dataset_id: str) -> dict`
- **Acceptance:** All CRUD operations work, data persists correctly

### 1.3 LLM Client

**Task:** Implement OpenAI client wrapper

- **File:** `backend/app/core/llm_client.py`
- **Implementation:**

  ```python
  from openai import AsyncOpenAI
  from tenacity import retry, stop_after_attempt, wait_exponential
  from app.config import get_settings

  class LLMClient:
      def __init__(self):
          settings = get_settings()
          self.client = AsyncOpenAI(api_key=settings.openai_api_key)
          self.default_model = "gpt-4-turbo-preview"

      @retry(
          stop=stop_after_attempt(3),
          wait=wait_exponential(multiplier=1, min=2, max=10)
      )
      async def complete(
          self,
          prompt: str,
          model: str = None,
          temperature: float = 0.7,
          max_tokens: int = 2000,
          **kwargs
      ) -> str:
          """Generate completion."""
          response = await self.client.chat.completions.create(
              model=model or self.default_model,
              messages=[{"role": "user", "content": prompt}],
              temperature=temperature,
              max_tokens=max_tokens,
              **kwargs
          )
          return response.choices[0].message.content

      @retry(stop=stop_after_attempt(3))
      async def embed(self, text: str) -> list[float]:
          """Generate embeddings."""
          response = await self.client.embeddings.create(
              model="text-embedding-ada-002",
              input=text
          )
          return response.data[0].embedding

      def count_tokens(self, text: str) -> int:
          """Approximate token count (1 token ≈ 4 chars)."""
          return len(text) // 4
  ```

- **Acceptance:** Completions work, embeddings generated, retry logic handles failures

### 1.4 Vector Store

**Task:** Implement ChromaDB wrapper

- **File:** `backend/app/core/vector_store.py`
- **Implementation:**

  ```python
  import chromadb
  from chromadb.config import Settings
  from app.config import get_settings

  class VectorStore:
      def __init__(self):
          settings = get_settings()
          self.client = chromadb.Client(Settings(
              persist_directory=settings.chromadb_persist_directory,
              anonymized_telemetry=False
          ))

      def get_or_create_collection(self, name: str):
          """Get or create a collection."""
          return self.client.get_or_create_collection(name=name)

      async def add_documents(
          self,
          collection_name: str,
          documents: list[str],
          metadatas: list[dict],
          ids: list[str],
          embeddings: list[list[float]]
      ):
          """Add documents to collection."""
          collection = self.get_or_create_collection(collection_name)
          collection.add(
              documents=documents,
              metadatas=metadatas,
              ids=ids,
              embeddings=embeddings
          )

      async def query(
          self,
          collection_name: str,
          query_embedding: list[float],
          n_results: int = 3
      ) -> dict:
          """Query collection for similar documents."""
          collection = self.get_or_create_collection(collection_name)
          return collection.query(
              query_embeddings=[query_embedding],
              n_results=n_results
          )
  ```

- **Acceptance:** Collections created, documents added, queries return results

### 1.5 SSE Streaming

**Task:** Create SSE utilities

- **File:** `backend/app/utils/streaming.py`
- **Implementation:**

  ```python
  import asyncio
  import json
  from dataclasses import dataclass
  from typing import AsyncGenerator
  from fastapi.responses import StreamingResponse

  @dataclass
  class SSEMessage:
      event: str
      data: dict

      def format(self) -> str:
          """Format as SSE message."""
          return f"event: {self.event}\ndata: {json.dumps(self.data)}\n\n"

  async def event_generator(queue: asyncio.Queue) -> AsyncGenerator[str, None]:
      """Generate SSE events from queue."""
      try:
          while True:
              message: SSEMessage = await queue.get()
              if message is None:  # Sentinel to stop
                  break
              yield message.format()
      except asyncio.CancelledError:
          pass

  def create_sse_response(queue: asyncio.Queue) -> StreamingResponse:
      """Create SSE StreamingResponse."""
      return StreamingResponse(
          event_generator(queue),
          media_type="text/event-stream",
          headers={
              "Cache-Control": "no-cache",
              "Connection": "keep-alive",
          }
      )
  ```

- **Acceptance:** SSE messages format correctly, frontend EventSource can parse

---

## 2. Service Layer Tasks

### 2.1 Framework Builder

**Task:** Implement RACE framework builder

- **File:** `backend/app/services/framework_builder.py`
- **Function:** `build_race(prompt: str, llm_client: LLMClient) -> str`
- **Steps:**
  1. Use LLM to analyze prompt and extract sections
  2. Generate role based on task domain
  3. Identify action/objective
  4. Extract or infer context
  5. Generate expectations and examples
  6. Format with XML delimiters
- **Example Output:**

  ```xml
  <role>
  You are an expert [domain] specialist with [X] years of experience.
  </role>

  <action>
  [Clear instruction of what to do]
  </action>

  <context>
  [Relevant background]
  [Constraints]
  </context>

  <expectations>
  [Output format]
  [Quality criteria]
  </expectations>

  <examples>
  [Example 1]
  [Example 2]
  </examples>
  ```

- **Acceptance:** Structured prompt maintains user intent, all sections present, valid XML

**Task:** Implement COSTAR framework builder

- **Function:** `build_costar(prompt: str, llm_client: LLMClient) -> str`
- **Sections:** Context, Objective, Style, Tone, Audience, Response format
- **Acceptance:** Appropriate for content creation tasks, all sections populated

**Task:** Implement APE framework builder

- **Function:** `build_ape(prompt: str, llm_client: LLMClient) -> str`
- **Sections:** Action, Purpose, Expectation (simplified)
- **Acceptance:** Quick to generate (<5s), maintains core intent

**Task:** Implement CREATE framework builder

- **Function:** `build_create(prompt: str, llm_client: LLMClient) -> str`
- **Sections:** Character, Request, Examples, Adjustments, Type, Extras
- **Acceptance:** Most comprehensive structure, suitable for complex tasks

### 2.2 Dataset Generator

**Task:** Create dataset generation meta-prompts

- **File:** `backend/app/prompts/dataset_generation.py`
- **Prompts:**
  - `EXAMPLE_GENERATION_PROMPT`: Generate diverse input examples
  - `OUTPUT_GENERATION_PROMPT`: Generate expected outputs
  - `CRITERIA_GENERATION_PROMPT`: Define evaluation criteria
- **Acceptance:** Prompts produce consistent, high-quality outputs

**Task:** Implement dataset generator service

- **File:** `backend/app/services/dataset_generator.py`
- **Function:** `async def generate(prompt: str, count: int, domain_hints: list) -> Dataset`
- **Steps:**
  1. Analyze prompt to identify domain and task type
  2. Generate `count` diverse examples (varying difficulty)
  3. For each example, generate expected output
  4. Define 5-6 evaluation criteria specific to domain
  5. Store in database
  6. Return Dataset object
- **Acceptance:** 15+ diverse examples, criteria relevant to task, stored in DB

### 2.3 Evaluator

**Task:** Create evaluation meta-prompts

- **File:** `backend/app/prompts/evaluation_prompts.py`
- **Prompts:**
  - `RELEVANCE_PROMPT`: Judge relevance to input
  - `ACCURACY_PROMPT`: Judge factual correctness
  - `LLM_AS_JUDGE_PROMPT`: General quality scoring
- **Acceptance:** Prompts return structured scores (JSON format)

**Task:** Implement evaluator service

- **File:** `backend/app/services/evaluator.py`
- **Class:** `Evaluator`
- **Methods:**
  - `async def evaluate(prompt, response, expected, criteria) -> Metrics`
  - `async def _calculate_relevance(response, expected) -> float`
  - `async def _llm_as_judge_accuracy(response, expected) -> float`
  - `def _calculate_consistency(response, expected) -> float`
  - `def _calculate_efficiency(response) -> float`
  - `def _calculate_readability(response) -> float`
  - `def aggregate_metrics(breakdown: list[Metrics]) -> Metrics`
- **Implementation Notes:**
  - Use temperature=0 for evaluation consistency
  - Cache evaluation results per (prompt, example) pair
  - Normalize scores to 0-100 range
- **Acceptance:** Metrics correlate with human judgment, consistent across runs

### 2.4 Technique Applier

**Task:** Implement Chain-of-Thought

- **File:** `backend/app/services/technique_applier.py`
- **Function:** `def apply_chain_of_thought(prompt: str) -> str`
- **Implementation:** Inject reasoning section after action/objective
- **Acceptance:** Reasoning scores improve by 15%+

**Task:** Implement Self-Consistency

- **Function:** `async def apply_self_consistency(prompt, llm_client, paths=3) -> str`
- **Implementation:** Generate multiple completions, aggregate via majority vote
- **Acceptance:** Output variance reduced, most common answer selected

**Task:** Implement Tree of Thoughts

- **Function:** `async def apply_tree_of_thoughts(prompt, llm_client, depth=3, branches=3) -> str`
- **Implementation:** Recursive branch exploration with evaluation and backtracking
- **Acceptance:** Best path selected, performance acceptable

**Task:** Implement RSIP

- **Function:** `async def apply_rsip(prompt, llm_client, iterations=3) -> RSIPResult`
- **Steps:**
  1. Generate critique of current prompt
  2. Generate improved version addressing critique
  3. Repeat for N iterations
  4. Return all iterations with critiques
- **Acceptance:** Each iteration improves on previous, structure preserved

**Task:** Implement RAG

- **Function:** `async def apply_rag(prompt, query, vector_store, llm_client, top_k=3) -> str`
- **Implementation:** Retrieve top-k docs, inject as <context> section
- **Acceptance:** Relevant docs retrieved, hallucinations reduced

### 2.5 RAG Service

**Task:** Implement RAG service

- **File:** `backend/app/services/rag_service.py`
- **Class:** `RAGService`
- **Methods:**
  - `async def add_documents(files: list[UploadFile]) -> list[str]`
  - `async def retrieve(query: str, top_k: int) -> list[Document]`
  - `def _chunk_document(text: str, chunk_size: int) -> list[str]`
- **Implementation:**
  - Chunk documents (500 words with 50-word overlap)
  - Generate embeddings via LLMClient
  - Store in ChromaDB with metadata
- **Acceptance:** Documents chunked appropriately, retrieval accurate

### 2.6 Optimization Service

**Task:** Implement main optimization orchestrator

- **File:** `backend/app/services/optimization_service.py`
- **Class:** `OptimizationService`
- **Method:** `async def optimize(request: OptimizeRequest, event_queue: asyncio.Queue) -> OptimizationComplete`
- **Steps:**
  1. Generate dataset (or load existing)
  2. Emit `dataset_generated` event
  3. For iteration 1 to 5:
     - Apply framework (iteration 1 only)
     - Apply selected techniques
     - Execute prompt on all dataset examples
     - Calculate metrics
     - Emit `metrics_calculated` event
     - Apply RSIP for improvement
     - Emit `prompt_improved` event
     - Store version in database
     - Emit `iteration_complete` event
  4. Select best version by aggregate score
  5. Emit `optimization_complete` event
- **Acceptance:** All 5 iterations complete, best version identified, events streamed

---

## 3. API Routes Tasks

### 3.1 Optimization Route

**Task:** Implement /api/optimize endpoint

- **File:** `backend/app/api/routes/optimization.py`
- **Endpoint:** `POST /api/optimize`
- **Implementation:**

  ```python
  from fastapi import APIRouter, BackgroundTasks
  from fastapi.responses import StreamingResponse
  import asyncio
  from app.api.models.prompt import OptimizeRequest
  from app.services.optimization_service import OptimizationService
  from app.utils.streaming import create_sse_response

  router = APIRouter()

  @router.post("/optimize")
  async def optimize_prompt(
      request: OptimizeRequest,
      background_tasks: BackgroundTasks
  ) -> StreamingResponse:
      queue = asyncio.Queue()

      async def run_optimization():
          service = OptimizationService()
          await service.optimize(request, queue)
          await queue.put(None)  # Sentinel

      background_tasks.add_task(run_optimization)
      return create_sse_response(queue)
  ```

- **Acceptance:** SSE stream works, all events emitted, optimization completes

### 3.2 Datasets Route

**Task:** Implement datasets endpoints

- **File:** `backend/app/api/routes/datasets.py`
- **Endpoints:**
  - `POST /api/datasets/generate`: Generate synthetic dataset
  - `GET /api/datasets/{dataset_id}`: Retrieve dataset
- **Acceptance:** Datasets created and retrievable

### 3.3 Other Routes

**Task:** Implement remaining endpoints

- **Files:** `evaluation.py`, `frameworks.py`, `versions.py`
- **Endpoints:** See API Specification (03-api-specification.md)
- **Acceptance:** All endpoints functional, matching spec

---

## 4. Frontend Tasks

### 4.1 Project Setup

**Task:** Initialize Next.js project

- **Command:** `npx create-next-app@latest frontend --typescript --app --tailwind`
- **Dependencies:** `npm install zustand @mui/base recharts`
- **Acceptance:** Dev server runs on port 3000

**Task:** Create type definitions

- **File:** `frontend/src/lib/types.ts`
- **Content:** Copy all TypeScript types from Data Models document
- **Acceptance:** Types match backend Pydantic models

**Task:** Create API client

- **File:** `frontend/src/lib/api-client.ts`
- **Methods:** All endpoints from API spec
- **Acceptance:** Successful API calls, error handling works

### 4.2 State Management

**Task:** Implement Zustand store

- **File:** `frontend/src/stores/optimization-store.ts`
- **Content:** Full store schema from Data Models document
- **Acceptance:** State updates correctly, persistence works

**Task:** Create SSE client

- **File:** `frontend/src/lib/streaming.ts`
- **Implementation:** EventSource wrapper with auto-reconnect
- **Acceptance:** Events parsed correctly, reconnects on disconnect

**Task:** Create useOptimization hook

- **File:** `frontend/src/hooks/use-optimization.ts`
- **Implementation:** Orchestrates optimization flow using store + SSE
- **Acceptance:** Hook manages lifecycle correctly

### 4.3 UI Components

**Task:** Build PromptInput component

- **File:** `frontend/src/components/optimizer/prompt-input.tsx`
- **Features:** Character counter, autosave, validation
- **Acceptance:** User can input and edit prompts

**Task:** Build FrameworkSelector component

- **File:** `frontend/src/components/optimizer/framework-selector.tsx`
- **Features:** Dropdown with descriptions, hover previews
- **Acceptance:** User can select framework, info displayed

**Task:** Build TechniqueToggles component

- **File:** `frontend/src/components/optimizer/technique-toggles.tsx`
- **Features:** Checkboxes, parameter sliders, compatibility warnings
- **Acceptance:** User can toggle techniques and adjust parameters

**Task:** Build OptimizationProgress component

- **File:** `frontend/src/components/optimizer/optimization-progress.tsx`
- **Features:** Real-time progress bar, live metrics, event log
- **Acceptance:** Updates in real-time via SSE

**Task:** Build VersionComparison component

- **File:** `frontend/src/components/optimizer/version-comparison.tsx`
- **Features:** Side-by-side diff, metrics comparison
- **Acceptance:** User can compare any two versions

**Task:** Build MetricsDashboard component

- **File:** `frontend/src/components/optimizer/metrics-dashboard.tsx`
- **Features:** Line charts, radar chart, summary cards
- **Acceptance:** Charts display correctly, interactive

**Task:** Build ExportPanel component

- **File:** `frontend/src/components/optimizer/export-panel.tsx`
- **Features:** Format selector, preview, export/copy buttons
- **Acceptance:** Export triggers download, copy works

---

## 5. Testing Tasks

### 5.1 Backend Tests

**Task:** Framework builder tests

- **File:** `backend/tests/test_framework_builder.py`
- **Tests:**
  - Test each framework builder produces valid XML
  - Test all required sections present
  - Test structure preservation with RSIP
- **Acceptance:** 90%+ code coverage

**Task:** Evaluator tests

- **File:** `backend/tests/test_evaluator.py`
- **Tests:**
  - Test each metric calculation
  - Test aggregate scoring
  - Test consistency across runs
- **Acceptance:** Metrics reproducible

**Task:** Optimization service tests

- **File:** `backend/tests/test_optimization_service.py`
- **Tests:**
  - Test 5-iteration loop completes
  - Test best version selection
  - Test SSE event emission
- **Acceptance:** Integration tests pass

### 5.2 Frontend Tests

**Task:** Component tests

- **Files:** `frontend/src/components/**/*.test.tsx`
- **Tests:**
  - Render tests for all components
  - User interaction tests
  - Store integration tests
- **Acceptance:** 75%+ code coverage

**Task:** E2E tests

- **Tool:** Playwright or Cypress
- **Tests:**
  - Full optimization flow
  - Export functionality
  - Error handling
- **Acceptance:** Critical paths covered

---

## 6. Documentation Tasks

**Task:** Create README.md

- **Sections:**
  - Project overview
  - Features list
  - Installation (backend + frontend)
  - Usage guide
  - Configuration
  - Troubleshooting
  - Architecture diagram
- **Acceptance:** New users can setup and run project

**Task:** API documentation

- **Location:** FastAPI auto-generated /docs
- **Add:** Detailed descriptions and examples to all endpoints
- **Acceptance:** API docs comprehensive and accurate

**Task:** Code documentation

- **Standard:** Docstrings for all public functions/classes
- **Type hints:** Everywhere (Python + TypeScript)
- **Acceptance:** Code self-documenting

---

## 7. Polish Tasks

**Task:** Dark mode implementation

- **Files:** `frontend/src/app/layout.tsx`, theme configuration
- **Implementation:** System preference detection, toggle in settings
- **Acceptance:** Dark mode works consistently across all components

**Task:** Loading states

- **Components:** All async operations show loading indicators
- **Implementation:** Skeletons, spinners, progress bars
- **Acceptance:** No jarring UI jumps, smooth transitions

**Task:** Error boundaries

- **Files:** `frontend/src/components/error-boundary.tsx`
- **Implementation:** Catch React errors, display fallback UI
- **Acceptance:** Errors don't crash app, user sees friendly message

**Task:** Accessibility audit

- **Tool:** Lighthouse, axe DevTools
- **Fixes:** Keyboard navigation, ARIA labels, color contrast
- **Acceptance:** Accessibility score 90+

**Task:** Performance optimization

- **Backend:** Query optimization, caching, connection pooling
- **Frontend:** Code splitting, memoization, virtual scrolling
- **Acceptance:** Meets performance criteria from requirements

---

## Acceptance Checklist

### Backend

- [ ] All API endpoints implemented and tested
- [ ] All 4 frameworks produce structured prompts
- [ ] All 6 techniques apply correctly
- [ ] Dataset generation creates diverse examples
- [ ] Evaluator calculates metrics accurately
- [ ] RSIP generates meaningful improvements
- [ ] SSE streaming works reliably
- [ ] Database persists data correctly
- [ ] ChromaDB RAG retrieval works
- [ ] Error handling robust
- [ ] Test coverage 85%+
- [ ] API documentation complete

### Frontend

- [ ] All UI components functional
- [ ] State management working
- [ ] SSE client receiving events
- [ ] Real-time progress display
- [ ] Version comparison working
- [ ] Metrics dashboard rendering
- [ ] Export functionality works
- [ ] History persistence working
- [ ] Dark mode implemented
- [ ] Loading states everywhere
- [ ] Error handling user-friendly
- [ ] Test coverage 75%+
- [ ] Accessibility score 90+

### Integration

- [ ] End-to-end optimization flow works
- [ ] Frontend-backend communication solid
- [ ] No CORS issues
- [ ] Authentication working
- [ ] Performance meets criteria
- [ ] No memory leaks
- [ ] Arize Phoenix tracing functional

### Documentation

- [ ] README complete with setup instructions
- [ ] API docs comprehensive
- [ ] Code documented with docstrings/comments
- [ ] Architecture diagrams created
- [ ] Troubleshooting guide written

---

**Document Status:** Approved for Implementation  
**Usage:** Reference during development for specific implementation details
