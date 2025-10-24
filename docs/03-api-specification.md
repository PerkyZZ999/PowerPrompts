# API Specification - PowerPrompts

**Version:** 1.0  
**Date:** October 19, 2025  
**Status:** Planning Phase  
**Base URL:** `http://localhost:8000`

## 1. Authentication

All API endpoints (except `/health`) require authentication via API key.

**Header:**
```
X-API-Key: <your-api-key>
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid API key
- `403 Forbidden`: API key lacks required permissions

## 2. Common Response Formats

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "meta": {
    "timestamp": "2025-10-19T12:00:00Z",
    "request_id": "uuid-v4"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Prompt must be between 10 and 10,000 characters",
    "details": {
      "field": "prompt",
      "value_length": 5
    }
  },
  "meta": {
    "timestamp": "2025-10-19T12:00:00Z",
    "request_id": "uuid-v4"
  }
}
```

### Error Codes
- `AUTHENTICATION_ERROR`: Invalid or missing API key
- `VALIDATION_ERROR`: Request validation failed
- `NOT_FOUND`: Resource not found
- `LLM_API_ERROR`: OpenAI API error
- `DATABASE_ERROR`: Database operation failed
- `INTERNAL_ERROR`: Unexpected server error

## 3. API Endpoints

### 3.1 Health Check

**Endpoint:** `GET /health`  
**Authentication:** Not required  
**Description:** Check system health and service availability

**Response:**
```json
{
  "status": "healthy",
  "services": {
    "database": {
      "status": "up",
      "type": "sqlite",
      "path": "/data/powerprompts.db"
    },
    "vector_store": {
      "status": "up",
      "type": "chromadb",
      "collections": 2
    },
    "llm_api": {
      "status": "up",
      "provider": "openai",
      "model": "gpt-4-turbo-preview"
    },
    "arize_phoenix": {
      "status": "up",
      "url": "http://localhost:6006"
    }
  },
  "version": "1.0.0",
  "uptime_seconds": 3600
}
```

**Status Codes:**
- `200 OK`: All services operational
- `503 Service Unavailable`: One or more critical services down

---

### 3.2 Optimize Prompt (SSE Stream)

**Endpoint:** `POST /api/optimize`  
**Authentication:** Required  
**Description:** Start prompt optimization with real-time SSE streaming

**Request Body:**
```json
{
  "prompt": "Write a blog post about AI",
  "framework": "RACE",
  "techniques": ["cot", "self_consistency", "rsip"],
  "parameters": {
    "temperature": 0.7,
    "top_p": 0.9,
    "max_tokens": 2000,
    "model": "gpt-4-turbo-preview"
  },
  "dataset_config": {
    "count": 15,
    "domain_hints": ["technology", "educational"]
  }
}
```

**Request Schema:**
- `prompt` (string, required): User's original prompt (10-10,000 chars)
- `framework` (enum, required): One of `"RACE"`, `"COSTAR"`, `"APE"`, `"CREATE"`
- `techniques` (array, optional): Array of technique IDs
- `parameters` (object, optional): LLM parameters
- `dataset_config` (object, optional): Dataset generation configuration

**Response:** Server-Sent Events stream

**SSE Event Types:**

**1. `dataset_generated`**
```
event: dataset_generated
data: {
  "dataset_id": "ds_abc123",
  "example_count": 15,
  "criteria": [
    "relevance",
    "accuracy",
    "clarity",
    "structure",
    "engagement"
  ]
}
```

**2. `iteration_start`**
```
event: iteration_start
data: {
  "iteration": 1,
  "prompt": "<role>You are an expert AI researcher...</role>..."
}
```

**3. `metrics_calculated`**
```
event: metrics_calculated
data: {
  "iteration": 1,
  "metrics": {
    "relevance": 78.5,
    "accuracy": 82.0,
    "consistency": 75.3,
    "efficiency": 45.2,
    "readability": 88.1,
    "aggregate": 73.82
  },
  "breakdown": [
    {
      "example_id": "ex_1",
      "relevance": 80,
      "accuracy": 85,
      "consistency": 75,
      "efficiency": 50,
      "readability": 90
    }
  ]
}
```

**4. `prompt_improved`**
```
event: prompt_improved
data: {
  "iteration": 1,
  "improved_prompt": "<role>You are an expert AI researcher with 10+ years...</role>...",
  "critique": "The prompt lacks specific examples and clear output format constraints. Adding structured examples will improve consistency.",
  "changes": [
    "Added expertise level to role",
    "Included 2 concrete examples",
    "Specified output format (Markdown with headers)"
  ]
}
```

**5. `iteration_complete`**
```
event: iteration_complete
data: {
  "iteration": 1,
  "version_id": "ver_abc123",
  "metrics": { /* same as metrics_calculated */ },
  "duration_seconds": 12.5,
  "tokens_used": 4500
}
```

**6. `optimization_complete`**
```
event: optimization_complete
data: {
  "prompt_id": "prm_xyz789",
  "best_version": 3,
  "all_iterations": [
    {
      "iteration": 1,
      "aggregate_score": 73.82,
      "version_id": "ver_abc123"
    },
    {
      "iteration": 2,
      "aggregate_score": 81.45,
      "version_id": "ver_abc124"
    },
    {
      "iteration": 3,
      "aggregate_score": 87.20,
      "version_id": "ver_abc125"
    },
    {
      "iteration": 4,
      "aggregate_score": 85.15,
      "version_id": "ver_abc126"
    },
    {
      "iteration": 5,
      "aggregate_score": 86.50,
      "version_id": "ver_abc127"
    }
  ],
  "improvement_percentage": 18.2,
  "total_duration_seconds": 65.3,
  "total_tokens_used": 22500
}
```

**7. `error`**
```
event: error
data: {
  "iteration": 3,
  "error": "LLM_API_ERROR",
  "message": "Rate limit exceeded. Retrying in 10 seconds...",
  "retry_count": 1,
  "max_retries": 3
}
```

**Status Codes:**
- `200 OK`: SSE stream started
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid API key
- `429 Too Many Requests`: Rate limit exceeded

**Client Implementation Example:**
```typescript
const eventSource = new EventSource('/api/optimize', {
  headers: { 'X-API-Key': apiKey }
});

eventSource.addEventListener('iteration_complete', (event) => {
  const data = JSON.parse(event.data);
  updateProgress(data);
});

eventSource.addEventListener('optimization_complete', (event) => {
  const data = JSON.parse(event.data);
  showResults(data);
  eventSource.close();
});
```

---

### 3.3 Generate Dataset

**Endpoint:** `POST /api/datasets/generate`  
**Authentication:** Required  
**Description:** Generate synthetic dataset for prompt testing

**Request Body:**
```json
{
  "prompt": "Write a blog post about AI",
  "count": 15,
  "domain_hints": ["technology", "educational"],
  "difficulty_levels": ["beginner", "intermediate", "advanced"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "dataset_id": "ds_abc123",
    "examples": [
      {
        "id": "ex_1",
        "input": "Write a blog post about AI for beginners",
        "expected_output": "# Understanding Artificial Intelligence\n\nArtificial Intelligence...",
        "difficulty": "beginner",
        "tags": ["introductory", "educational"]
      },
      {
        "id": "ex_2",
        "input": "Write a technical blog post about transformer architecture",
        "expected_output": "# Deep Dive: Transformer Architecture\n\nThe transformer model...",
        "difficulty": "advanced",
        "tags": ["technical", "architecture"]
      }
    ],
    "criteria": [
      {
        "name": "relevance",
        "description": "How well the output addresses the input topic",
        "weight": 1.0
      },
      {
        "name": "accuracy",
        "description": "Factual correctness of technical content",
        "weight": 1.2
      },
      {
        "name": "clarity",
        "description": "Readability and logical flow",
        "weight": 0.9
      },
      {
        "name": "structure",
        "description": "Proper use of headings, paragraphs, formatting",
        "weight": 0.8
      },
      {
        "name": "engagement",
        "description": "Interesting and engaging writing style",
        "weight": 0.7
      }
    ],
    "generated_at": "2025-10-19T12:00:00Z"
  }
}
```

**Status Codes:**
- `200 OK`: Dataset generated successfully
- `400 Bad Request`: Invalid parameters
- `401 Unauthorized`: Missing API key
- `502 Bad Gateway`: LLM API error

---

### 3.4 Get Dataset

**Endpoint:** `GET /api/datasets/{dataset_id}`  
**Authentication:** Required  
**Description:** Retrieve existing dataset

**Response:**
```json
{
  "success": true,
  "data": {
    "dataset_id": "ds_abc123",
    "prompt_id": "prm_xyz789",
    "examples": [ /* array of examples */ ],
    "criteria": [ /* array of criteria */ ],
    "generated_at": "2025-10-19T12:00:00Z"
  }
}
```

**Status Codes:**
- `200 OK`: Dataset found
- `404 Not Found`: Dataset does not exist
- `401 Unauthorized`: Missing API key

---

### 3.5 Evaluate Prompt

**Endpoint:** `POST /api/evaluate`  
**Authentication:** Required  
**Description:** Evaluate a prompt against a dataset

**Request Body:**
```json
{
  "prompt": "<role>You are an expert AI researcher...</role>...",
  "dataset_id": "ds_abc123",
  "techniques": ["cot", "self_consistency"],
  "parameters": {
    "temperature": 0.7,
    "model": "gpt-4-turbo-preview"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "evaluation_id": "eval_def456",
    "metrics": {
      "relevance": 78.5,
      "accuracy": 82.0,
      "consistency": 75.3,
      "efficiency": 45.2,
      "readability": 88.1,
      "aggregate": 73.82
    },
    "breakdown": [
      {
        "example_id": "ex_1",
        "input": "Write a blog post about AI for beginners",
        "output": "# Understanding AI...",
        "metrics": {
          "relevance": 80,
          "accuracy": 85,
          "consistency": 75,
          "efficiency": 50,
          "readability": 90
        },
        "tokens_used": 450,
        "latency_ms": 1200
      }
    ],
    "total_tokens": 4500,
    "total_latency_ms": 15000,
    "evaluated_at": "2025-10-19T12:00:00Z"
  }
}
```

**Status Codes:**
- `200 OK`: Evaluation complete
- `400 Bad Request`: Invalid parameters
- `404 Not Found`: Dataset not found
- `502 Bad Gateway`: LLM API error

---

### 3.6 List Frameworks

**Endpoint:** `GET /api/frameworks`  
**Authentication:** Required  
**Description:** Get all available frameworks with metadata

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "RACE",
      "name": "RACE Framework",
      "sections": ["role", "action", "context", "expectations", "examples"],
      "description": "General-purpose optimization with clear role definition and examples",
      "use_case": "Best starting point for most prompts",
      "complexity": "medium",
      "recommended_for": ["general", "business", "technical"]
    },
    {
      "id": "COSTAR",
      "name": "COSTAR Framework",
      "sections": ["context", "objective", "style", "tone", "audience", "response"],
      "description": "Detailed guidance for content creation tasks",
      "use_case": "Content creation, marketing, creative writing",
      "complexity": "high",
      "recommended_for": ["content", "marketing", "creative"]
    },
    {
      "id": "APE",
      "name": "APE Framework",
      "sections": ["action", "purpose", "expectation"],
      "description": "Quick optimization for simple, routine tasks",
      "use_case": "Fast, beginner-friendly optimization",
      "complexity": "low",
      "recommended_for": ["simple", "quick", "routine"]
    },
    {
      "id": "CREATE",
      "name": "CREATE Framework",
      "sections": ["character", "request", "examples", "adjustments", "type", "extras"],
      "description": "Most comprehensive structure for complex tasks",
      "use_case": "Complex, comprehensive content generation",
      "complexity": "high",
      "recommended_for": ["complex", "detailed", "comprehensive"]
    }
  ]
}
```

**Status Codes:**
- `200 OK`: Frameworks retrieved
- `401 Unauthorized`: Missing API key

---

### 3.7 List Techniques

**Endpoint:** `GET /api/techniques`  
**Authentication:** Required  
**Description:** Get all available techniques with compatibility info

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cot",
      "name": "Chain-of-Thought",
      "description": "Add step-by-step reasoning instructions",
      "improvement": "+35% in reasoning tasks, -28% math errors",
      "compatible_tasks": ["reasoning", "math", "logic", "analysis"],
      "incompatible_with": [],
      "requires": [],
      "parameters": {
        "reasoning_depth": {
          "type": "integer",
          "default": 3,
          "min": 1,
          "max": 10
        }
      }
    },
    {
      "id": "self_consistency",
      "name": "Self-Consistency",
      "description": "Generate multiple reasoning paths, select most common answer",
      "improvement": "Significantly better accuracy for reliability-critical tasks",
      "compatible_tasks": ["reasoning", "decision_making", "analysis"],
      "incompatible_with": [],
      "requires": ["cot"],
      "parameters": {
        "num_paths": {
          "type": "integer",
          "default": 3,
          "min": 2,
          "max": 10
        }
      }
    },
    {
      "id": "tot",
      "name": "Tree of Thoughts",
      "description": "Explore multiple reasoning branches with backtracking",
      "improvement": "Best for combinatorial solution spaces",
      "compatible_tasks": ["problem_solving", "planning", "strategy", "puzzles"],
      "incompatible_with": [],
      "requires": ["cot"],
      "parameters": {
        "depth": {
          "type": "integer",
          "default": 3,
          "min": 2,
          "max": 5
        },
        "branches": {
          "type": "integer",
          "default": 3,
          "min": 2,
          "max": 5
        }
      }
    },
    {
      "id": "rsip",
      "name": "Recursive Self-Improvement Prompting",
      "description": "3-iteration self-critique loop for quality improvement",
      "improvement": "Significantly improved output quality",
      "compatible_tasks": ["writing", "creative", "technical", "quality_critical"],
      "incompatible_with": [],
      "requires": [],
      "parameters": {
        "iterations": {
          "type": "integer",
          "default": 3,
          "min": 1,
          "max": 5
        }
      }
    },
    {
      "id": "rag",
      "name": "Retrieval-Augmented Generation",
      "description": "Vector database retrieval before generation",
      "improvement": "-42-68% hallucinations, up to 89% factual accuracy",
      "compatible_tasks": ["factual", "knowledge", "research", "domain_specific"],
      "incompatible_with": [],
      "requires": [],
      "parameters": {
        "top_k": {
          "type": "integer",
          "default": 3,
          "min": 1,
          "max": 10
        },
        "similarity_threshold": {
          "type": "number",
          "default": 0.7,
          "min": 0.0,
          "max": 1.0
        }
      }
    },
    {
      "id": "prompt_chaining",
      "name": "Prompt Chaining",
      "description": "Break complex tasks into sequential subtasks",
      "improvement": "Clear audit trail, better accuracy for multi-step tasks",
      "compatible_tasks": ["multi_step", "workflow", "complex"],
      "incompatible_with": [],
      "requires": [],
      "parameters": {
        "max_subtasks": {
          "type": "integer",
          "default": 5,
          "min": 2,
          "max": 10
        }
      }
    }
  ]
}
```

**Status Codes:**
- `200 OK`: Techniques retrieved
- `401 Unauthorized`: Missing API key

---

### 3.8 Get Prompt Versions

**Endpoint:** `GET /api/prompts/{prompt_id}/versions`  
**Authentication:** Required  
**Description:** Get all versions for a specific prompt

**Query Parameters:**
- `include_metrics` (boolean, default: true): Include evaluation metrics
- `include_critique` (boolean, default: false): Include RSIP critiques

**Response:**
```json
{
  "success": true,
  "data": {
    "prompt_id": "prm_xyz789",
    "original_prompt": "Write a blog post about AI",
    "framework": "RACE",
    "versions": [
      {
        "version_id": "ver_abc123",
        "iteration": 0,
        "prompt_text": "Write a blog post about AI",
        "metrics": null,
        "critique": null,
        "created_at": "2025-10-19T12:00:00Z"
      },
      {
        "version_id": "ver_abc124",
        "iteration": 1,
        "prompt_text": "<role>You are an expert AI researcher...</role>...",
        "metrics": {
          "relevance": 78.5,
          "accuracy": 82.0,
          "consistency": 75.3,
          "efficiency": 45.2,
          "readability": 88.1,
          "aggregate": 73.82
        },
        "critique": "The prompt lacks specific examples...",
        "techniques": ["cot", "rsip"],
        "parameters": {
          "temperature": 0.7,
          "model": "gpt-4-turbo-preview"
        },
        "created_at": "2025-10-19T12:01:30Z"
      }
    ]
  }
}
```

**Status Codes:**
- `200 OK`: Versions retrieved
- `404 Not Found`: Prompt does not exist
- `401 Unauthorized`: Missing API key

---

### 3.9 Export Version

**Endpoint:** `POST /api/export`  
**Authentication:** Required  
**Description:** Export a prompt version in specified format

**Request Body:**
```json
{
  "version_id": "ver_abc123",
  "format": "markdown",
  "include": {
    "metrics": true,
    "critique": true,
    "parameters": true,
    "metadata": true
  }
}
```

**Request Schema:**
- `version_id` (string, required): Version to export
- `format` (enum, required): One of `"json"`, `"markdown"`, `"text"`
- `include` (object, optional): What to include in export

**Response (JSON format):**
```json
{
  "success": true,
  "data": {
    "format": "json",
    "filename": "powerprompts_ver_abc123_2025-10-19.json",
    "content": {
      "version_id": "ver_abc123",
      "iteration": 3,
      "framework": "RACE",
      "prompt": "<role>...</role>...",
      "metrics": { /* ... */ },
      "critique": "...",
      "parameters": { /* ... */ },
      "exported_at": "2025-10-19T12:00:00Z"
    }
  }
}
```

**Response (Markdown format):**
```json
{
  "success": true,
  "data": {
    "format": "markdown",
    "filename": "powerprompts_ver_abc123_2025-10-19.md",
    "content": "# Optimized Prompt - Version 3\n\n## Framework: RACE\n\n..."
  }
}
```

**Response (Plain Text format):**
```json
{
  "success": true,
  "data": {
    "format": "text",
    "filename": "powerprompts_ver_abc123_2025-10-19.txt",
    "content": "<role>You are an expert AI researcher...</role>..."
  }
}
```

**Status Codes:**
- `200 OK`: Export successful
- `404 Not Found`: Version does not exist
- `400 Bad Request`: Invalid format
- `401 Unauthorized`: Missing API key

---

### 3.10 Upload RAG Documents

**Endpoint:** `POST /api/rag/upload`  
**Authentication:** Required  
**Description:** Upload documents to RAG knowledge base

**Request Body (multipart/form-data):**
```
files: [File, File, ...] (max 10 files, 5MB each)
collection_name: string (optional)
metadata: { source: string, domain: string } (optional)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "collection_name": "knowledge_base",
    "documents_added": 5,
    "document_ids": ["doc_1", "doc_2", "doc_3", "doc_4", "doc_5"],
    "total_chunks": 42,
    "embedding_model": "text-embedding-ada-002"
  }
}
```

**Status Codes:**
- `200 OK`: Documents uploaded successfully
- `400 Bad Request`: Invalid file format or size
- `413 Payload Too Large`: File exceeds size limit
- `401 Unauthorized`: Missing API key

---

### 3.11 Delete RAG Collection

**Endpoint:** `DELETE /api/rag/collections/{collection_name}`  
**Authentication:** Required  
**Description:** Delete a RAG knowledge base collection

**Response:**
```json
{
  "success": true,
  "data": {
    "collection_name": "knowledge_base",
    "documents_deleted": 42,
    "deleted_at": "2025-10-19T12:00:00Z"
  }
}
```

**Status Codes:**
- `200 OK`: Collection deleted
- `404 Not Found`: Collection does not exist
- `401 Unauthorized`: Missing API key

---

## 4. Rate Limiting

**Current Limits (Local Deployment):**
- No rate limiting enforced (single-user)

**Future Considerations:**
- If multi-user: 100 requests per minute per API key
- LLM API rate limits handled by OpenAI SDK with automatic retry

---

## 5. Pagination

**For endpoints returning lists (future enhancement):**

**Query Parameters:**
- `page` (integer, default: 1): Page number
- `limit` (integer, default: 20, max: 100): Items per page
- `sort` (string, default: "created_at"): Sort field
- `order` (enum, default: "desc"): `"asc"` or `"desc"`

**Response:**
```json
{
  "success": true,
  "data": [ /* items */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_items": 150,
    "total_pages": 8,
    "has_next": true,
    "has_previous": false
  }
}
```

---

## 6. WebSocket Alternative (Not Implemented in MVP)

**For bi-directional communication (future):**

**Endpoint:** `ws://localhost:8000/ws/optimize`

**Client Send:**
```json
{
  "action": "pause_optimization",
  "prompt_id": "prm_xyz789"
}
```

**Server Send:**
```json
{
  "event": "iteration_complete",
  "data": { /* same as SSE data */ }
}
```

---

**Document Status:** Approved for Implementation  
**Next Steps:** Review data models and implement API routes

