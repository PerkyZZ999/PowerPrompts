# Data Models - PowerPrompts

**Version:** 1.0  
**Date:** October 19, 2025  
**Status:** Planning Phase

## 1. Database Schema (SQLite)

### 1.1 Prompts Table

Stores the original user prompts and optimization metadata.

```sql
CREATE TABLE prompts (
    id TEXT PRIMARY KEY,                    -- UUID v4
    original_prompt TEXT NOT NULL,          -- User's input prompt
    framework TEXT NOT NULL                 -- Selected framework
        CHECK(framework IN ('RACE', 'COSTAR', 'APE', 'CREATE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_prompts_created_at ON prompts(created_at DESC);
CREATE INDEX idx_prompts_framework ON prompts(framework);
```

**Columns:**

- `id`: Unique identifier (format: `prm_{uuid}`)
- `original_prompt`: Unmodified user input (10-10,000 chars)
- `framework`: Selected optimization framework
- `created_at`: Timestamp of prompt creation
- `updated_at`: Last modification timestamp

### 1.2 Versions Table

Stores each iteration of prompt optimization with metrics and critiques.

```sql
CREATE TABLE versions (
    id TEXT PRIMARY KEY,                    -- UUID v4
    prompt_id TEXT NOT NULL                 -- Foreign key to prompts
        REFERENCES prompts(id) ON DELETE CASCADE,
    iteration INTEGER NOT NULL              -- 0=original, 1-5=optimized
        CHECK(iteration >= 0 AND iteration <= 5),
    prompt_text TEXT NOT NULL,              -- Full structured prompt
    critique TEXT,                          -- RSIP critique (nullable for iteration 0)
    metrics_json TEXT NOT NULL,             -- JSON serialized metrics
    techniques_json TEXT,                   -- JSON array of technique IDs
    parameters_json TEXT,                   -- JSON object of LLM params
    tokens_used INTEGER,                    -- Total tokens for this iteration
    duration_seconds REAL,                  -- Execution time in seconds
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(prompt_id, iteration)            -- One version per iteration
);

-- Indexes
CREATE INDEX idx_versions_prompt_id ON versions(prompt_id);
CREATE INDEX idx_versions_iteration ON versions(prompt_id, iteration);
CREATE INDEX idx_versions_created_at ON versions(created_at DESC);

-- Example metrics_json:
-- {
--   "relevance": 78.5,
--   "accuracy": 82.0,
--   "consistency": 75.3,
--   "efficiency": 45.2,
--   "readability": 88.1,
--   "aggregate": 73.82
-- }

-- Example techniques_json:
-- ["cot", "self_consistency", "rsip"]

-- Example parameters_json:
-- {
--   "temperature": 0.7,
--   "top_p": 0.9,
--   "max_tokens": 2000,
--   "model": "gpt-4-turbo-preview"
-- }
```

**Columns:**

- `id`: Unique identifier (format: `ver_{uuid}`)
- `prompt_id`: Reference to parent prompt
- `iteration`: 0 for original, 1-5 for optimized versions
- `prompt_text`: Full prompt with framework structure
- `critique`: RSIP-generated improvement suggestions
- `metrics_json`: Serialized evaluation metrics
- `techniques_json`: Applied techniques array
- `parameters_json`: LLM configuration used
- `tokens_used`: Total token count for evaluation
- `duration_seconds`: Time taken for iteration
- `created_at`: Timestamp of version creation

### 1.3 Datasets Table

Stores synthetic test datasets for prompt evaluation.

```sql
CREATE TABLE datasets (
    id TEXT PRIMARY KEY,                    -- UUID v4
    prompt_id TEXT                          -- Optional FK to prompts
        REFERENCES prompts(id) ON DELETE SET NULL,
    examples_json TEXT NOT NULL,            -- JSON array of test examples
    criteria_json TEXT NOT NULL,            -- JSON array of eval criteria
    example_count INTEGER NOT NULL,         -- Number of examples
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_datasets_prompt_id ON datasets(prompt_id);
CREATE INDEX idx_datasets_generated_at ON datasets(generated_at DESC);

-- Example examples_json:
-- [
--   {
--     "id": "ex_1",
--     "input": "Write a blog post about AI for beginners",
--     "expected_output": "# Understanding AI\n\nAI is...",
--     "difficulty": "beginner",
--     "tags": ["introductory", "educational"]
--   }
-- ]

-- Example criteria_json:
-- [
--   {
--     "name": "relevance",
--     "description": "How well output addresses input topic",
--     "weight": 1.0
--   },
--   {
--     "name": "accuracy",
--     "description": "Factual correctness",
--     "weight": 1.2
--   }
-- ]
```

**Columns:**

- `id`: Unique identifier (format: `ds_{uuid}`)
- `prompt_id`: Optional reference to prompt (nullable)
- `examples_json`: Array of test examples with inputs/outputs
- `criteria_json`: Evaluation criteria definitions
- `example_count`: Number of examples (denormalized for performance)
- `generated_at`: Timestamp of dataset creation

### 1.4 Evaluations Table (Optional - Future Enhancement)

Stores detailed evaluation results for analysis.

```sql
CREATE TABLE evaluations (
    id TEXT PRIMARY KEY,                    -- UUID v4
    version_id TEXT NOT NULL                -- FK to versions
        REFERENCES versions(id) ON DELETE CASCADE,
    dataset_id TEXT NOT NULL                -- FK to datasets
        REFERENCES datasets(id) ON DELETE CASCADE,
    example_id TEXT NOT NULL,               -- Example being evaluated
    output TEXT NOT NULL,                   -- LLM-generated output
    metrics_json TEXT NOT NULL,             -- Per-example metrics
    tokens_used INTEGER,                    -- Tokens for this example
    latency_ms INTEGER,                     -- Response time
    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_evaluations_version_id ON evaluations(version_id);
CREATE INDEX idx_evaluations_dataset_id ON evaluations(dataset_id);
```

---

## 2. Pydantic Models (Backend)

### 2.1 Core Enums

```python
from enum import Enum
from typing import Literal

class Framework(str, Enum):
    """Supported prompt optimization frameworks."""
    RACE = "RACE"
    COSTAR = "COSTAR"
    APE = "APE"
    CREATE = "CREATE"

class Technique(str, Enum):
    """Available optimization techniques."""
    CHAIN_OF_THOUGHT = "cot"
    SELF_CONSISTENCY = "self_consistency"
    TREE_OF_THOUGHTS = "tot"
    RSIP = "rsip"
    RAG = "rag"
    PROMPT_CHAINING = "prompt_chaining"

class ExportFormat(str, Enum):
    """Supported export formats."""
    JSON = "json"
    MARKDOWN = "markdown"
    TEXT = "text"
```

### 2.2 Request Models

```python
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any

class LLMParameters(BaseModel):
    """LLM generation parameters."""
    temperature: float = Field(
        default=0.7,
        ge=0.0,
        le=2.0,
        description="Sampling temperature (0=deterministic, 2=very random)"
    )
    top_p: float = Field(
        default=0.9,
        ge=0.0,
        le=1.0,
        description="Nucleus sampling parameter"
    )
    max_tokens: int = Field(
        default=2000,
        ge=1,
        le=4000,
        description="Maximum tokens to generate"
    )
    model: str = Field(
        default="gpt-4-turbo-preview",
        description="OpenAI model name"
    )

class DatasetConfig(BaseModel):
    """Configuration for dataset generation."""
    count: int = Field(
        default=15,
        ge=5,
        le=50,
        description="Number of examples to generate"
    )
    domain_hints: Optional[List[str]] = Field(
        default=None,
        description="Domain tags for context (e.g., ['technology', 'educational'])"
    )
    difficulty_levels: List[str] = Field(
        default=["beginner", "intermediate", "advanced"],
        description="Mix of difficulty levels"
    )

class OptimizeRequest(BaseModel):
    """Request to optimize a prompt."""
    prompt: str = Field(
        ...,
        min_length=10,
        max_length=10000,
        description="User's original prompt"
    )
    framework: Framework = Field(
        ...,
        description="Selected optimization framework"
    )
    techniques: List[Technique] = Field(
        default_factory=list,
        description="Techniques to apply during optimization"
    )
    parameters: LLMParameters = Field(
        default_factory=LLMParameters,
        description="LLM generation parameters"
    )
    dataset_config: DatasetConfig = Field(
        default_factory=DatasetConfig,
        description="Dataset generation configuration"
    )

    @validator('prompt')
    def sanitize_prompt(cls, v):
        """Remove leading/trailing whitespace."""
        return v.strip()

    @validator('techniques')
    def validate_technique_compatibility(cls, v):
        """Check technique requirements."""
        if Technique.SELF_CONSISTENCY in v and Technique.CHAIN_OF_THOUGHT not in v:
            raise ValueError("Self-Consistency requires Chain-of-Thought")
        if Technique.TREE_OF_THOUGHTS in v and Technique.CHAIN_OF_THOUGHT not in v:
            raise ValueError("Tree of Thoughts requires Chain-of-Thought")
        return v

class DatasetRequest(BaseModel):
    """Request to generate a synthetic dataset."""
    prompt: str = Field(
        ...,
        min_length=10,
        max_length=10000
    )
    count: int = Field(default=15, ge=5, le=50)
    domain_hints: Optional[List[str]] = None
    difficulty_levels: List[str] = Field(
        default=["beginner", "intermediate", "advanced"]
    )

class EvaluateRequest(BaseModel):
    """Request to evaluate a prompt."""
    prompt: str = Field(..., min_length=10)
    dataset_id: str = Field(..., regex=r"^ds_[a-f0-9-]+$")
    techniques: List[Technique] = Field(default_factory=list)
    parameters: LLMParameters = Field(default_factory=LLMParameters)

class ExportRequest(BaseModel):
    """Request to export a prompt version."""
    version_id: str = Field(..., regex=r"^ver_[a-f0-9-]+$")
    format: ExportFormat
    include: Dict[str, bool] = Field(
        default={
            "metrics": True,
            "critique": True,
            "parameters": True,
            "metadata": True
        }
    )
```

### 2.3 Response Models

```python
from datetime import datetime
from typing import List, Dict, Any, Optional

class Metrics(BaseModel):
    """Evaluation metrics for a prompt version."""
    relevance: float = Field(ge=0.0, le=100.0)
    accuracy: float = Field(ge=0.0, le=100.0)
    consistency: float = Field(ge=0.0, le=100.0)
    efficiency: float = Field(ge=0.0, le=100.0)
    readability: float = Field(ge=0.0, le=100.0)
    aggregate: float = Field(ge=0.0, le=100.0)

class ExampleBreakdown(BaseModel):
    """Per-example evaluation breakdown."""
    example_id: str
    input: str
    output: str
    expected_output: Optional[str] = None
    metrics: Metrics
    tokens_used: int
    latency_ms: int

class IterationResult(BaseModel):
    """Result of a single optimization iteration."""
    iteration: int = Field(ge=0, le=5)
    version_id: str
    prompt: str
    critique: Optional[str] = None
    metrics: Metrics
    breakdown: List[ExampleBreakdown] = []
    techniques: List[Technique] = []
    parameters: LLMParameters
    tokens_used: int
    duration_seconds: float
    created_at: datetime

class OptimizationComplete(BaseModel):
    """Final optimization result."""
    prompt_id: str
    best_version: int
    all_iterations: List[IterationResult]
    improvement_percentage: float
    total_duration_seconds: float
    total_tokens_used: int

class Example(BaseModel):
    """A single test example in a dataset."""
    id: str
    input: str
    expected_output: str
    difficulty: str = Field(default="intermediate")
    tags: List[str] = Field(default_factory=list)

class EvaluationCriterion(BaseModel):
    """Evaluation criterion definition."""
    name: str
    description: str
    weight: float = Field(default=1.0, ge=0.0, le=2.0)

class Dataset(BaseModel):
    """Synthetic dataset for prompt testing."""
    dataset_id: str
    prompt_id: Optional[str] = None
    examples: List[Example]
    criteria: List[EvaluationCriterion]
    example_count: int
    generated_at: datetime

class Version(BaseModel):
    """A single prompt version."""
    version_id: str
    prompt_id: str
    iteration: int
    prompt_text: str
    critique: Optional[str] = None
    metrics: Optional[Metrics] = None
    techniques: List[Technique] = []
    parameters: Optional[LLMParameters] = None
    tokens_used: Optional[int] = None
    duration_seconds: Optional[float] = None
    created_at: datetime

class FrameworkInfo(BaseModel):
    """Framework metadata."""
    id: str
    name: str
    sections: List[str]
    description: str
    use_case: str
    complexity: Literal["low", "medium", "high"]
    recommended_for: List[str]

class TechniqueInfo(BaseModel):
    """Technique metadata."""
    id: str
    name: str
    description: str
    improvement: str
    compatible_tasks: List[str]
    incompatible_with: List[str] = []
    requires: List[str] = []
    parameters: Dict[str, Any] = {}
```

### 2.4 SSE Event Models

```python
class SSEEvent(BaseModel):
    """Base SSE event."""
    event: str
    data: Dict[str, Any]

class DatasetGeneratedEvent(SSEEvent):
    """Dataset generation complete."""
    event: Literal["dataset_generated"] = "dataset_generated"
    data: Dict[str, Any]  # Contains dataset_id, example_count, criteria

class IterationStartEvent(SSEEvent):
    """Iteration started."""
    event: Literal["iteration_start"] = "iteration_start"
    data: Dict[str, Any]  # Contains iteration, prompt

class MetricsCalculatedEvent(SSEEvent):
    """Metrics calculated."""
    event: Literal["metrics_calculated"] = "metrics_calculated"
    data: Dict[str, Any]  # Contains iteration, metrics, breakdown

class PromptImprovedEvent(SSEEvent):
    """Prompt improved via RSIP."""
    event: Literal["prompt_improved"] = "prompt_improved"
    data: Dict[str, Any]  # Contains iteration, improved_prompt, critique

class IterationCompleteEvent(SSEEvent):
    """Iteration complete."""
    event: Literal["iteration_complete"] = "iteration_complete"
    data: IterationResult

class OptimizationCompleteEvent(SSEEvent):
    """Optimization complete."""
    event: Literal["optimization_complete"] = "optimization_complete"
    data: OptimizationComplete

class ErrorEvent(SSEEvent):
    """Error occurred."""
    event: Literal["error"] = "error"
    data: Dict[str, Any]  # Contains error, message, retry_count
```

---

## 3. TypeScript Types (Frontend)

### 3.1 Core Types

```typescript
// lib/types.ts

export type Framework = "RACE" | "COSTAR" | "APE" | "CREATE";

export type Technique =
  | "cot"
  | "self_consistency"
  | "tot"
  | "rsip"
  | "rag"
  | "prompt_chaining";

export type ExportFormat = "json" | "markdown" | "text";

export interface LLMParameters {
  temperature: number; // 0.0-2.0
  top_p: number; // 0.0-1.0
  max_tokens: number; // 1-4000
  model: string;
}

export interface DatasetConfig {
  count: number; // 5-50
  domain_hints?: string[];
  difficulty_levels: string[];
}

export interface Metrics {
  relevance: number; // 0-100
  accuracy: number; // 0-100
  consistency: number; // 0-100
  efficiency: number; // 0-100
  readability: number; // 0-100
  aggregate: number; // 0-100
}

export interface ExampleBreakdown {
  example_id: string;
  input: string;
  output: string;
  expected_output?: string;
  metrics: Metrics;
  tokens_used: number;
  latency_ms: number;
}

export interface IterationResult {
  iteration: number; // 0-5
  version_id: string;
  prompt: string;
  critique?: string;
  metrics: Metrics;
  breakdown: ExampleBreakdown[];
  techniques: Technique[];
  parameters: LLMParameters;
  tokens_used: number;
  duration_seconds: number;
  created_at: string; // ISO 8601
}

export interface OptimizationComplete {
  prompt_id: string;
  best_version: number;
  all_iterations: IterationResult[];
  improvement_percentage: number;
  total_duration_seconds: number;
  total_tokens_used: number;
}

export interface Example {
  id: string;
  input: string;
  expected_output: string;
  difficulty: string;
  tags: string[];
}

export interface EvaluationCriterion {
  name: string;
  description: string;
  weight: number; // 0.0-2.0
}

export interface Dataset {
  dataset_id: string;
  prompt_id?: string;
  examples: Example[];
  criteria: EvaluationCriterion[];
  example_count: number;
  generated_at: string; // ISO 8601
}

export interface Version {
  version_id: string;
  prompt_id: string;
  iteration: number;
  prompt_text: string;
  critique?: string;
  metrics?: Metrics;
  techniques: Technique[];
  parameters?: LLMParameters;
  tokens_used?: number;
  duration_seconds?: number;
  created_at: string; // ISO 8601
}

export interface FrameworkInfo {
  id: Framework;
  name: string;
  sections: string[];
  description: string;
  use_case: string;
  complexity: "low" | "medium" | "high";
  recommended_for: string[];
}

export interface TechniqueInfo {
  id: Technique;
  name: string;
  description: string;
  improvement: string;
  compatible_tasks: string[];
  incompatible_with: Technique[];
  requires: Technique[];
  parameters: Record<string, any>;
}
```

### 3.2 SSE Event Types

```typescript
// lib/streaming.ts

export type SSEEventType =
  | "dataset_generated"
  | "iteration_start"
  | "metrics_calculated"
  | "prompt_improved"
  | "iteration_complete"
  | "optimization_complete"
  | "error";

export interface SSEEvent<T = any> {
  event: SSEEventType;
  data: T;
}

export interface DatasetGeneratedEventData {
  dataset_id: string;
  example_count: number;
  criteria: string[];
}

export interface IterationStartEventData {
  iteration: number;
  prompt: string;
}

export interface MetricsCalculatedEventData {
  iteration: number;
  metrics: Metrics;
  breakdown: ExampleBreakdown[];
}

export interface PromptImprovedEventData {
  iteration: number;
  improved_prompt: string;
  critique: string;
  changes: string[];
}

export interface ErrorEventData {
  iteration?: number;
  error: string;
  message: string;
  retry_count: number;
  max_retries: number;
}
```

### 3.3 API Request Types

```typescript
// lib/api-client.ts

export interface OptimizeRequest {
  prompt: string; // 10-10,000 chars
  framework: Framework;
  techniques: Technique[];
  parameters: LLMParameters;
  dataset_config: DatasetConfig;
}

export interface DatasetRequest {
  prompt: string;
  count: number; // 5-50
  domain_hints?: string[];
  difficulty_levels: string[];
}

export interface EvaluateRequest {
  prompt: string;
  dataset_id: string;
  techniques: Technique[];
  parameters: LLMParameters;
}

export interface ExportRequest {
  version_id: string;
  format: ExportFormat;
  include: {
    metrics: boolean;
    critique: boolean;
    parameters: boolean;
    metadata: boolean;
  };
}
```

### 3.4 API Response Types

```typescript
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta: {
    timestamp: string;
    request_id: string;
  };
}

export interface HealthResponse {
  status: "healthy" | "degraded" | "down";
  services: {
    database: { status: "up" | "down"; type: string; path: string };
    vector_store: { status: "up" | "down"; type: string; collections: number };
    llm_api: { status: "up" | "down"; provider: string; model: string };
    arize_phoenix: { status: "up" | "down"; url: string };
  };
  version: string;
  uptime_seconds: number;
}
```

---

## 4. Zustand Store Schema

```typescript
// stores/optimization-store.ts

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface OptimizationState {
  // Current optimization session
  currentPrompt: string;
  framework: Framework | null;
  techniques: Technique[];
  parameters: LLMParameters;

  // Optimization state
  isOptimizing: boolean;
  currentIteration: number;
  iterations: IterationResult[];

  // Dataset
  dataset: Dataset | null;
  isGeneratingDataset: boolean;

  // UI state
  selectedVersion: number | null; // For comparison
  comparisonVersion: number | null; // Second version for comparison

  // History (persisted)
  recentPrompts: Array<{
    prompt_id: string;
    original_prompt: string;
    framework: Framework;
    best_aggregate: number;
    created_at: string;
  }>;
}

interface OptimizationActions {
  // Setters
  setPrompt: (prompt: string) => void;
  setFramework: (framework: Framework) => void;
  toggleTechnique: (technique: Technique) => void;
  setParameters: (params: Partial<LLMParameters>) => void;

  // Optimization control
  startOptimization: (request: OptimizeRequest) => Promise<void>;
  addIteration: (result: IterationResult) => void;
  completeOptimization: (result: OptimizationComplete) => void;
  resetOptimization: () => void;

  // Dataset
  setDataset: (dataset: Dataset) => void;
  setGeneratingDataset: (isGenerating: boolean) => void;

  // UI
  setSelectedVersion: (iteration: number | null) => void;
  setComparisonVersion: (iteration: number | null) => void;

  // History
  addToHistory: (promptInfo: OptimizationState["recentPrompts"][0]) => void;
}

type OptimizationStore = OptimizationState & OptimizationActions;

const useOptimizationStore = create<OptimizationStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentPrompt: "",
        framework: null,
        techniques: [],
        parameters: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2000,
          model: "gpt-4-turbo-preview",
        },
        isOptimizing: false,
        currentIteration: 0,
        iterations: [],
        dataset: null,
        isGeneratingDataset: false,
        selectedVersion: null,
        comparisonVersion: null,
        recentPrompts: [],

        // Actions implementation...
        setPrompt: (prompt) => set({ currentPrompt: prompt }),
        setFramework: (framework) => set({ framework }),
        toggleTechnique: (technique) =>
          set((state) => ({
            techniques: state.techniques.includes(technique)
              ? state.techniques.filter((t) => t !== technique)
              : [...state.techniques, technique],
          })),
        // ... more actions
      }),
      {
        name: "optimization-storage",
        partialize: (state) => ({
          recentPrompts: state.recentPrompts,
          parameters: state.parameters,
        }),
      },
    ),
  ),
);

export default useOptimizationStore;
```

---

## 5. ChromaDB Collections

### 5.1 Knowledge Base Collection

```python
# Collection name: "knowledge_base"
# Purpose: Store RAG documents

collection_config = {
    "name": "knowledge_base",
    "metadata": {
        "description": "RAG knowledge base for document retrieval"
    },
    "embedding_function": "text-embedding-ada-002"
}

# Document schema
document = {
    "id": "doc_abc123",
    "content": "Full document text content...",
    "embedding": [0.123, 0.456, ...],  # 1536-dim vector
    "metadata": {
        "source": "uploaded_file",
        "title": "AI Guide Chapter 3",
        "timestamp": "2025-10-19T12:00:00Z",
        "domain": "technology",
        "file_name": "ai_guide.pdf",
        "chunk_index": 0
    }
}
```

### 5.2 Prompt Embeddings Collection

```python
# Collection name: "prompt_embeddings"
# Purpose: Semantic search for similar prompts

collection_config = {
    "name": "prompt_embeddings",
    "metadata": {
        "description": "Prompt embeddings for similarity search"
    },
    "embedding_function": "text-embedding-ada-002"
}

# Prompt embedding schema
prompt_embedding = {
    "id": "prm_xyz789",
    "content": "Original prompt text...",
    "embedding": [0.789, 0.234, ...],  # 1536-dim vector
    "metadata": {
        "prompt_id": "prm_xyz789",
        "framework": "RACE",
        "aggregate_score": 87.2,
        "best_iteration": 3,
        "created_at": "2025-10-19T12:00:00Z"
    }
}
```

---

**Document Status:** Approved for Implementation  
**Next Steps:** Review implementation roadmap and begin development
