# System Architecture - PowerPrompts

**Version:** 1.0  
**Date:** October 19, 2025  
**Status:** Planning Phase

## 1. Architecture Overview

PowerPrompts follows a three-tier architecture with clear separation of concerns:

1. **Presentation Layer:** Next.js TypeScript frontend with Base UI components
2. **Application Layer:** FastAPI Python backend with RESTful API and SSE streaming
3. **Data Layer:** SQLite for relational data, ChromaDB for vector storage

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Next.js 15 + TypeScript + Base UI + Tailwind      │   │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────┐  │   │
│  │  │  UI        │  │  Zustand   │  │  SSE Client  │  │   │
│  │  │  Components│  │  Store     │  │  (EventSrc)  │  │   │
│  │  └────────────┘  └────────────┘  └──────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/SSE
┌─────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           FastAPI Backend (Python 3.11+)            │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │  API Routes (REST + SSE)                     │  │   │
│  │  │  /api/optimize, /datasets, /evaluate, etc.  │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │  Service Layer                               │  │   │
│  │  │  • OptimizationService (orchestrator)        │  │   │
│  │  │  • FrameworkBuilder (RACE/COSTAR/APE/CREATE) │  │   │
│  │  │  • TechniqueApplier (CoT/ToT/RSIP/RAG)       │  │   │
│  │  │  • DatasetGenerator (synthetic data)         │  │   │
│  │  │  • Evaluator (metrics calculation)           │  │   │
│  │  │  • RAGService (vector retrieval)             │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │  Core Layer                                  │  │   │
│  │  │  • LLMClient (OpenAI SDK wrapper)           │  │   │
│  │  │  • VectorStore (ChromaDB wrapper)           │  │   │
│  │  │  • ArizeClient (Phoenix integration)        │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                       DATA LAYER                             │
│  ┌────────────────────┐        ┌──────────────────────┐    │
│  │  SQLite Database   │        │  ChromaDB            │    │
│  │  • prompts table   │        │  • Vector embeddings │    │
│  │  • versions table  │        │  • RAG knowledge     │    │
│  │  • datasets table  │        │  • Similarity search │    │
│  └────────────────────┘        └──────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## 2. Component Responsibilities

### 2.1 Frontend Components (Next.js + Base UI)

#### UI Components (`src/components/optimizer/`)

**PromptInput Component**
- Responsibilities:
  - Multi-line textarea with character count
  - Input validation (10-10,000 characters)
  - Autosave to local storage every 30 seconds
  - Paste formatting cleanup
- Props: `value`, `onChange`, `placeholder`, `maxLength`
- State: Local editing state with debounced updates

**FrameworkSelector Component**
- Responsibilities:
  - Dropdown with 4 framework options (RACE, COSTAR, APE, CREATE)
  - Display framework description and use case on hover
  - Visual indicators for selected framework
- Props: `selected`, `onSelect`, `frameworks[]`

**TechniqueToggles Component**
- Responsibilities:
  - Checkbox group for 6+ techniques
  - Show/hide advanced options (temperature, top-p)
  - Technique compatibility warnings (e.g., ToT requires CoT)
  - Parameter sliders with real-time value display
- Props: `enabled[]`, `onToggle`, `parameters`, `onParameterChange`

**OptimizationProgress Component**
- Responsibilities:
  - Real-time progress bar (1/5, 2/5, etc.)
  - Live metric display during optimization
  - SSE event consumption and visualization
  - Iteration status (running, complete, failed)
  - Estimated time remaining
- Props: `sseUrl`, `onComplete`, `onError`

**VersionComparison Component**
- Responsibilities:
  - Side-by-side diff view with syntax highlighting
  - Metrics comparison table with delta indicators
  - Version selector dropdowns (any iteration vs any iteration)
  - Copy to clipboard functionality
- Props: `version1`, `version2`, `showMetrics`

**MetricsDashboard Component**
- Responsibilities:
  - Line charts showing metric evolution across iterations
  - Summary cards (best version, avg improvement, etc.)
  - Radar chart comparing 5 metrics for selected version
  - Export charts as PNG
- Props: `iterations[]`, `selectedVersion`

**ExportPanel Component**
- Responsibilities:
  - Format selection (JSON, Markdown, Plain Text)
  - Preview before export
  - One-click download with appropriate MIME type
  - Include/exclude options (metrics, critique, parameters)
- Props: `version`, `onExport`

#### State Management (`src/stores/optimization-store.ts`)

**Zustand Store Structure:**
```typescript
interface OptimizationStore {
  // Current optimization session
  currentPrompt: string;
  framework: Framework;
  techniques: Technique[];
  parameters: LLMParameters;
  
  // Optimization state
  isOptimizing: boolean;
  currentIteration: number;
  iterations: IterationResult[];
  
  // Dataset
  dataset: Dataset | null;
  isGeneratingDataset: boolean;
  
  // Actions
  setPrompt: (prompt: string) => void;
  setFramework: (framework: Framework) => void;
  toggleTechnique: (technique: Technique) => void;
  setParameters: (params: Partial<LLMParameters>) => void;
  startOptimization: () => Promise<void>;
  addIteration: (result: IterationResult) => void;
  resetOptimization: () => void;
}
```

#### API Client (`src/lib/api-client.ts`)

**Responsibilities:**
- HTTP client wrapper with error handling
- Request/response type safety
- Automatic API key injection from environment
- Retry logic for transient failures
- Request timeout management (30s default)

**Core Methods:**
- `optimize(request: OptimizeRequest): EventSource` - Returns SSE connection
- `generateDataset(prompt: string): Promise<Dataset>`
- `evaluate(prompt: string, datasetId: string): Promise<Metrics>`
- `getFrameworks(): Promise<Framework[]>`
- `getVersions(promptId: string): Promise<Version[]>`
- `exportVersion(versionId: string, format: ExportFormat): Promise<Blob>`

#### SSE Client (`src/lib/streaming.ts`)

**Responsibilities:**
- EventSource wrapper with reconnection logic
- Typed event parsing
- Connection state management
- Automatic cleanup on unmount
- Error boundary integration

**Event Types:**
- `iteration_start`: `{ iteration: number, prompt: string }`
- `metrics_calculated`: `{ iteration: number, metrics: Metrics }`
- `prompt_improved`: `{ iteration: number, improved_prompt: string, critique: string }`
- `iteration_complete`: `{ iteration: number, result: IterationResult }`
- `optimization_complete`: `{ best_version: number, all_iterations: IterationResult[] }`

### 2.2 Backend Components (FastAPI + Python)

#### API Routes (`app/api/routes/`)

**optimization.py**
```python
@router.post("/optimize")
async def optimize_prompt(
    request: OptimizeRequest,
    background_tasks: BackgroundTasks
) -> StreamingResponse:
    """
    Main optimization endpoint with SSE streaming.
    
    Flow:
    1. Validate request and authenticate
    2. Generate dataset if not provided
    3. Create optimization task
    4. Return SSE stream
    5. Execute 5-iteration loop in background
    6. Stream events as iterations complete
    """
```

**datasets.py**
```python
@router.post("/generate")
async def generate_dataset(request: DatasetRequest) -> Dataset:
    """Generate synthetic dataset for prompt testing."""
    
@router.get("/{dataset_id}")
async def get_dataset(dataset_id: str) -> Dataset:
    """Retrieve existing dataset."""
```

**evaluation.py**
```python
@router.post("/evaluate")
async def evaluate_prompt(request: EvaluateRequest) -> EvaluationResult:
    """Evaluate a prompt against a dataset."""
```

**frameworks.py**
```python
@router.get("/frameworks")
async def list_frameworks() -> List[FrameworkInfo]:
    """Return available frameworks with metadata."""

@router.get("/techniques")
async def list_techniques() -> List[TechniqueInfo]:
    """Return available techniques with compatibility info."""
```

**versions.py**
```python
@router.get("/{prompt_id}/versions")
async def get_versions(prompt_id: str) -> List[Version]:
    """Get all versions for a prompt."""

@router.post("/export")
async def export_version(request: ExportRequest) -> FileResponse:
    """Export version in specified format."""
```

#### Service Layer (`app/services/`)

**OptimizationService (`optimization_service.py`)**

**Responsibilities:**
- Orchestrate 5-iteration optimization loop
- Coordinate between FrameworkBuilder, TechniqueApplier, Evaluator
- Manage SSE event emission
- Handle error recovery and rollback
- Log to Arize Phoenix for observability

**Core Method:**
```python
async def optimize(
    self,
    prompt: str,
    framework: Framework,
    techniques: List[Technique],
    parameters: LLMParameters,
    dataset: Dataset,
    event_queue: asyncio.Queue
) -> OptimizationResult:
    """
    Execute 5-iteration optimization loop.
    
    For each iteration:
    1. Apply framework structure
    2. Apply selected techniques
    3. Execute against dataset
    4. Calculate metrics
    5. Generate critique via RSIP
    6. Create improved version
    7. Emit SSE events
    """
```

**FrameworkBuilder (`framework_builder.py`)**

**Responsibilities:**
- Transform raw prompts into structured frameworks
- Apply XML delimiters for clear sections
- Validate framework structure
- Support all 4 frameworks: RACE, COSTAR, APE, CREATE

**Methods:**
- `build_race(prompt: str) -> str`
- `build_costar(prompt: str) -> str`
- `build_ape(prompt: str) -> str`
- `build_create(prompt: str) -> str`
- `extract_sections(prompt: str, framework: Framework) -> Dict[str, str]`

**Example RACE Output:**
```xml
<role>
You are an expert {domain} specialist with {years} years of experience.
</role>

<action>
{clear instruction of what to do}
</action>

<context>
{relevant background information}
{constraints and requirements}
</context>

<expectations>
{output format specifications}
{quality criteria}
</expectations>

<examples>
{2-3 demonstration examples}
</examples>
```

**TechniqueApplier (`technique_applier.py`)**

**Responsibilities:**
- Apply selected techniques to structured prompts
- Implement CoT, ToT, Self-Consistency, RSIP, RAG, Prompt Chaining
- Handle technique compatibility and ordering
- Inject technique-specific instructions

**Methods:**
- `apply_chain_of_thought(prompt: str) -> str`
- `apply_self_consistency(prompt: str, paths: int = 3) -> str`
- `apply_tree_of_thoughts(prompt: str, depth: int = 3) -> str`
- `apply_rsip(prompt: str, iterations: int = 3) -> RSIPResult`
- `apply_rag(prompt: str, context_docs: List[str]) -> str`
- `apply_prompt_chaining(prompt: str, subtasks: List[str]) -> List[str]`

**DatasetGenerator (`dataset_generator.py`)**

**Responsibilities:**
- Generate 10-20 diverse synthetic examples per prompt
- Create expected outputs for each example
- Define 5-6 domain-specific evaluation criteria
- Ensure example diversity (semantic clustering)
- Validate generated data quality

**Core Method:**
```python
async def generate(
    self,
    prompt: str,
    count: int = 15,
    domain_hints: Optional[List[str]] = None
) -> Dataset:
    """
    Generate synthetic dataset using meta-prompting.
    
    Steps:
    1. Analyze prompt to identify domain and task type
    2. Generate diverse input examples (varying difficulty, edge cases)
    3. Generate expected outputs for each example
    4. Define evaluation criteria (relevance, accuracy, etc.)
    5. Store in SQLite and return dataset ID
    """
```

**Evaluator (`evaluator.py`)**

**Responsibilities:**
- Calculate 5 core metrics for each iteration
- Implement LLM-as-judge for subjective metrics
- Compute aggregate scores across dataset
- Generate per-example breakdowns
- Track metric trends

**Metrics Implementation:**

```python
class Evaluator:
    async def evaluate(
        self,
        prompt: str,
        response: str,
        expected: str,
        criteria: List[str]
    ) -> Metrics:
        """Calculate all metrics for a single example."""
        
        relevance = await self._calculate_relevance(response, expected)
        accuracy = await self._llm_as_judge_accuracy(response, expected)
        consistency = self._calculate_consistency(response, expected)
        efficiency = self._calculate_efficiency(response)
        readability = self._calculate_readability(response)
        
        return Metrics(
            relevance=relevance,
            accuracy=accuracy,
            consistency=consistency,
            efficiency=efficiency,
            readability=readability,
            aggregate=(relevance + accuracy + consistency + 
                      (100 - efficiency) + readability) / 5
        )
```

**RAGService (`rag_service.py`)**

**Responsibilities:**
- Manage ChromaDB vector store
- Generate embeddings via OpenAI Ada-002
- Retrieve top-k relevant documents
- Inject retrieved context into prompts
- Handle collection management

**Methods:**
- `add_documents(documents: List[Document]) -> List[str]`
- `retrieve(query: str, top_k: int = 3) -> List[Document]`
- `delete_collection(name: str) -> None`
- `create_collection(name: str) -> Collection`

#### Core Layer (`app/core/`)

**LLMClient (`llm_client.py`)**

**Responsibilities:**
- Wrapper around OpenAI Python SDK
- Unified interface for completions and embeddings
- Automatic retry with exponential backoff
- Token counting and cost tracking
- Streaming support for long completions

**Configuration:**
- Default model: `gpt-4-turbo-preview`
- Fallback model: `gpt-3.5-turbo`
- Max retries: 3
- Timeout: 60 seconds

**VectorStore (`vector_store.py`)**

**Responsibilities:**
- ChromaDB client wrapper
- Connection management
- Collection lifecycle management
- Query optimization
- Error handling for vector operations

**ArizeClient (`arize_client.py`)**

**Responsibilities:**
- Arize Phoenix local integration
- Trace optimization sessions
- Log LLM calls with latency metrics
- Track evaluation results
- Generate observability dashboards

### 2.3 Data Layer

#### SQLite Database Schema

```sql
-- Core prompts table
CREATE TABLE prompts (
    id TEXT PRIMARY KEY,
    original_prompt TEXT NOT NULL,
    framework TEXT NOT NULL CHECK(framework IN ('RACE', 'COSTAR', 'APE', 'CREATE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optimization iterations/versions
CREATE TABLE versions (
    id TEXT PRIMARY KEY,
    prompt_id TEXT NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    iteration INTEGER NOT NULL CHECK(iteration >= 0 AND iteration <= 5),
    prompt_text TEXT NOT NULL,
    critique TEXT,
    metrics_json TEXT NOT NULL, -- JSON serialized metrics
    techniques_json TEXT, -- JSON array of applied techniques
    parameters_json TEXT, -- JSON object of LLM parameters
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(prompt_id, iteration)
);

-- Synthetic datasets
CREATE TABLE datasets (
    id TEXT PRIMARY KEY,
    prompt_id TEXT REFERENCES prompts(id) ON DELETE SET NULL,
    examples_json TEXT NOT NULL, -- JSON array of examples
    criteria_json TEXT NOT NULL, -- JSON array of evaluation criteria
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_versions_prompt_id ON versions(prompt_id);
CREATE INDEX idx_versions_iteration ON versions(prompt_id, iteration);
CREATE INDEX idx_datasets_prompt_id ON datasets(prompt_id);
```

#### ChromaDB Collections

**Collection: `knowledge_base`**
- Purpose: Store RAG documents for retrieval
- Metadata: `{ source, title, timestamp, domain }`
- Embedding model: `text-embedding-ada-002`

**Collection: `prompt_embeddings`**
- Purpose: Store prompt embeddings for similarity search
- Metadata: `{ prompt_id, framework, aggregate_score }`

## 3. Data Flow Diagrams

### 3.1 Optimization Request Flow

```
User submits prompt
        ↓
Frontend validates input
        ↓
POST /api/optimize with framework + techniques
        ↓
Backend validates API key
        ↓
OptimizationService.optimize() called
        ↓
DatasetGenerator.generate() → SQLite
        ↓
SSE stream established to frontend
        ↓
For iteration 1 to 5:
    ├→ FrameworkBuilder.build_{framework}()
    ├→ TechniqueApplier.apply_{techniques}()
    ├→ LLMClient.complete() for each dataset example
    ├→ Evaluator.evaluate() → Calculate metrics
    ├→ TechniqueApplier.apply_rsip() → Generate critique & improved version
    ├→ Store version in SQLite
    ├→ Emit SSE event: iteration_complete
    └→ Frontend updates UI in real-time
        ↓
Select best version by aggregate score
        ↓
Emit SSE event: optimization_complete
        ↓
Frontend displays final results
        ↓
User exports optimized prompt
```

### 3.2 RAG Retrieval Flow

```
User enables RAG technique
        ↓
User uploads/selects knowledge base documents
        ↓
POST /api/rag/upload with documents
        ↓
RAGService.add_documents()
        ├→ LLMClient.embed() → Generate embeddings
        └→ VectorStore.insert() → Store in ChromaDB
        ↓
During optimization:
    ├→ For each dataset example input:
    ├→ RAGService.retrieve(query=example_input, top_k=3)
    ├→ VectorStore.query() → Similarity search in ChromaDB
    ├→ Inject top-3 documents as <context> in prompt
    └→ LLMClient.complete() with enhanced prompt
```

### 3.3 SSE Streaming Architecture

```
Backend (FastAPI):
    ├→ async def optimize_prompt() creates asyncio.Queue
    ├→ Background task: optimization_loop(queue)
    ├→ Return StreamingResponse(event_generator(queue))
    └→ event_generator yields SSE formatted events
    
Frontend (Next.js):
    ├→ const eventSource = new EventSource('/api/optimize')
    ├→ eventSource.onmessage = (event) => {
    │      const data = JSON.parse(event.data)
    │      store.addIteration(data)
    │      updateUI()
    │   }
    └→ Handle connection errors with auto-reconnect
```

## 4. Technology Decisions and Rationale

### 4.1 Why FastAPI for Backend?
- **Native async support:** Perfect for SSE streaming and concurrent LLM calls
- **Automatic OpenAPI docs:** Built-in Swagger UI at `/docs`
- **Pydantic integration:** Type-safe request/response validation
- **Performance:** Comparable to Node.js, better Python ecosystem for ML/AI
- **Developer experience:** Clear, intuitive API design

### 4.2 Why Next.js 15 for Frontend?
- **App Router:** Modern React patterns with Server Components (future-ready)
- **TypeScript first:** Excellent type safety and IntelliSense
- **Developer experience:** Fast refresh, excellent error messages
- **Build optimization:** Automatic code splitting and optimization
- **Familiar:** User's preferred frontend framework

### 4.3 Why Base UI over ShadCN?
- **Newer and actively maintained:** More frequent updates
- **Headless architecture:** Full styling control with Tailwind
- **MUI ecosystem:** Backed by Material-UI team
- **Accessibility first:** WCAG 2.1 AA compliant out of the box
- **Performance:** Smaller bundle size than full component libraries

### 4.4 Why SSE over WebSockets?
- **Simpler implementation:** Native browser EventSource API
- **Unidirectional:** Backend → Frontend (sufficient for progress updates)
- **Automatic reconnection:** Built-in browser support
- **HTTP/2 friendly:** Works over standard HTTP
- **Lower overhead:** No handshake protocol needed

### 4.5 Why SQLite over PostgreSQL?
- **Zero configuration:** No database server to install
- **Perfect for local:** Single-user, local-only deployment
- **ACID compliant:** Full transaction support
- **File-based:** Easy backup and migration
- **Performance:** Fast for <1M records (way beyond requirements)

### 4.6 Why ChromaDB over FAISS?
- **Developer friendly:** Simple Python API
- **Metadata filtering:** Rich query capabilities beyond vectors
- **Persistence:** Built-in SQLite storage
- **Local-first:** No cloud dependencies
- **Active development:** Strong community and updates

### 4.7 Why Arize Phoenix over Other Observability Tools?
- **Open source:** Free for local use
- **LLM-specific:** Built for prompt engineering and LLM apps
- **Local deployment:** No data sent to cloud
- **Minimal setup:** Python package installation
- **Rich visualizations:** Trace timelines, token usage, cost tracking

## 5. Security Architecture

### 5.1 Authentication Flow

```
Frontend Request:
    Headers: {
        "X-API-Key": process.env.NEXT_PUBLIC_API_KEY
    }
        ↓
Backend Middleware:
    ├→ Extract X-API-Key from headers
    ├→ Compare with API_KEY from .env
    ├→ If valid: continue to route handler
    └→ If invalid: return 401 Unauthorized
```

### 5.2 Input Validation

**Frontend Validation:**
- Character limits (10-10,000)
- Framework selection from enum
- Technique compatibility checks

**Backend Validation (Pydantic):**
```python
class OptimizeRequest(BaseModel):
    prompt: str = Field(min_length=10, max_length=10000)
    framework: Framework  # Enum validation
    techniques: List[Technique] = Field(default_factory=list)
    parameters: LLMParameters
    
    @validator('prompt')
    def sanitize_prompt(cls, v):
        # Remove potentially harmful characters
        return v.strip()
```

### 5.3 Data Protection

- **API keys in .env:** Never committed to version control
- **No sensitive logging:** Prompts may contain proprietary info
- **Local storage only:** No cloud data transmission
- **SQL injection prevention:** SQLAlchemy ORM with parameterized queries

## 6. Scalability Considerations

### Current Architecture (MVP):
- **Single user, local deployment**
- **Synchronous optimization:** One session at a time
- **In-memory queue:** SSE events via asyncio.Queue

### Future Scaling Options:
- **Multi-user:** Add PostgreSQL, Redis for session management
- **Distributed:** Celery + RabbitMQ for background tasks
- **Caching:** Redis for prompt/dataset caching
- **Load balancing:** Multiple FastAPI instances behind Nginx
- **Cloud vector store:** Pinecone for larger RAG knowledge bases

## 7. Error Handling Strategy

### Frontend Error Handling:
- **Network errors:** Retry with exponential backoff (3 attempts)
- **SSE disconnection:** Auto-reconnect every 5 seconds
- **Validation errors:** Inline form error messages
- **API errors:** Toast notifications with error details

### Backend Error Handling:
```python
@app.exception_handler(OpenAIError)
async def openai_error_handler(request, exc):
    """Handle OpenAI API errors gracefully."""
    log_error(exc)
    return JSONResponse(
        status_code=502,
        content={
            "error": "LLM API Error",
            "message": "The AI service is temporarily unavailable",
            "retry_after": 30
        }
    )
```

### Error Categories:
1. **User errors (4xx):** Invalid input, authentication failure
2. **System errors (5xx):** LLM API failure, database error
3. **Transient errors:** Retry automatically (rate limits, timeouts)
4. **Fatal errors:** Log and notify user, rollback transactions

## 8. Performance Optimization

### Backend Optimizations:
- **Connection pooling:** Reuse HTTP connections to OpenAI
- **Batch processing:** Evaluate multiple examples in parallel
- **Caching:** Cache framework templates, evaluation prompts
- **Database indexes:** Optimize frequent queries
- **Async everywhere:** Non-blocking I/O for all operations

### Frontend Optimizations:
- **Code splitting:** Lazy load components (React.lazy)
- **Memoization:** React.memo for expensive components
- **Virtual scrolling:** For large version history lists
- **Debouncing:** Autosave with 500ms debounce
- **State optimization:** Zustand selectors to prevent re-renders

---

**Document Status:** Approved for Implementation  
**Next Steps:** Review API specification and data models

