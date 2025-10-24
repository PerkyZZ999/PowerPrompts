# PowerPrompts Backend - Node.js/TypeScript

AI-powered prompt optimization system with advanced techniques and frameworks.

## 🚀 Features

### Prompt Optimization Frameworks
- **RACE**: Role, Action, Context, Expectation
- **COSTAR**: Context, Objective, Style, Tone, Audience, Response
- **APE**: Action, Purpose, Expectation
- **CREATE**: Character, Request, Examples, Adjustments, Type, Extras

### Advanced Techniques
- **Chain-of-Thought (CoT)**: Step-by-step reasoning
- **Self-Consistency**: Multiple reasoning paths with majority voting
- **Tree of Thoughts (ToT)**: Recursive branch exploration
- **RSIP**: Recursive Self-Improvement Prompting
- **RAG**: Retrieval-Augmented Generation
- **Prompt Chaining**: Sequential execution with output passing

### Core Capabilities
- 🔄 5-iteration optimization loop
- 📊 5 evaluation metrics (relevance, accuracy, consistency, efficiency, readability)
- 🧪 Synthetic dataset generation
- 📈 Real-time SSE streaming
- 💾 SQLite database persistence
- 🔍 ChromaDB vector storage for RAG
- 🔐 API key authentication

## 📦 Tech Stack

- **Runtime**: Node.js 18+ / TypeScript 5.3
- **Framework**: Fastify 4.x
- **Database**: SQLite (sql.js)
- **Vector Store**: ChromaDB
- **LLM**: OpenAI GPT-4
- **Validation**: Zod
- **Utilities**: nanoid, date-fns, tiktoken

## 🏗️ Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env`:

```env
OPENAI_API_KEY=your-openai-api-key-here
PORT=8000
NODE_ENV=development
DATABASE_PATH=./data/powerprompts.db
API_KEY=cG93ZXJwcm9tcHRz
CHROMA_PATH=./data/chroma
```

### 3. Start the Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

Server runs on `http://localhost:8000`

## 📡 API Endpoints

### Health Check
```bash
GET /health
```

### Frameworks
```bash
GET /api/frameworks
# Returns all available frameworks with metadata
```

### Techniques
```bash
GET /api/techniques
# Returns all techniques with compatibility matrix
```

### Optimization (SSE Streaming)
```bash
POST /api/optimize
Content-Type: application/json
X-API-Key: cG93ZXJwcm9tcHRz

{
  "prompt": "Your prompt here",
  "selected_framework": "RACE",
  "techniques_enabled": ["cot", "rsip"],
  "parameters": {
    "temperature": 0.7,
    "top_p": 0.9,
    "max_tokens": 2000,
    "model": "gpt-4-turbo-preview"
  },
  "dataset_config": {
    "example_count": 15,
    "difficulty_levels": ["easy", "medium", "hard"]
  }
}
```

### Versions
```bash
GET /api/versions/:promptId
# Get all versions for a prompt

GET /api/versions/compare/:version1Id/:version2Id
# Compare two versions
```

### RAG
```bash
POST /api/rag/upload
# Upload document to collection

POST /api/rag/search
# Search documents

GET /api/rag/collections
# List all collections

GET /api/rag/collections/:collectionName/documents
# List documents in collection
```

## 🔄 Optimization Pipeline

The optimization pipeline follows these steps:

1. **Store Prompt**: Save original prompt to database
2. **Generate Dataset**: Create synthetic test examples
3. **Build Framework**: Structure prompt with selected framework
4. **Apply Techniques**: Add CoT, RAG, etc.
5. **5-Iteration Loop**:
   - Execute prompt on all examples
   - Apply technique-specific execution (Self-Consistency, ToT)
   - Evaluate with 5 metrics
   - Store version in database
   - Apply RSIP for improvement
   - Stream progress via SSE
6. **Select Best**: Choose highest-scoring version
7. **Return Results**: Stream complete event

## 📊 Evaluation Metrics

Each iteration is evaluated on 5 metrics:

1. **Relevance** (0-100): How well output addresses input
2. **Accuracy** (0-100): Factual correctness
3. **Consistency** (0-100): Uniformity across examples
4. **Efficiency** (0-100): Token usage vs output quality
5. **Readability** (0-100): Clarity and structure

**Aggregate Score**: Weighted average of all metrics

## 🗂️ Project Structure

```
backend/
├── src/
│   ├── api/
│   │   ├── middleware/       # Auth middleware
│   │   ├── routes/           # API endpoints
│   │   └── schemas/          # Zod validation schemas
│   ├── core/
│   │   ├── llm-client.ts     # OpenAI wrapper
│   │   └── vector-store.ts   # ChromaDB wrapper
│   ├── db/
│   │   ├── schema.sql        # Database schema
│   │   ├── database.ts       # DB connection
│   │   └── crud.ts           # CRUD operations
│   ├── prompts/
│   │   ├── frameworks.ts     # Framework meta-prompts
│   │   ├── dataset-generation.ts
│   │   ├── evaluation-prompts.ts
│   │   └── meta-optimizer.ts
│   ├── services/
│   │   ├── framework-builder.ts
│   │   ├── dataset-generator.ts
│   │   ├── evaluator.ts
│   │   ├── technique-applier.ts
│   │   ├── optimization-service.ts
│   │   └── rag-service.ts
│   ├── utils/
│   │   ├── streaming.ts      # SSE utilities
│   │   ├── validators.ts     # Input validation
│   │   └── delimiters.ts     # XML utilities
│   ├── config.ts             # Environment config
│   └── server.ts             # Main entry point
├── data/                     # Generated at runtime
│   ├── powerprompts.db      # SQLite database
│   └── chroma/              # Vector store
├── package.json
├── tsconfig.json
└── .env
```

## 🧪 Testing

```bash
# Run type check
npm run type-check

# Run linter
npm run lint

# Format code
npm run format
```

## 🔐 Authentication

All API endpoints (except `/health` and `/`) require API key authentication:

```bash
X-API-Key: cG93ZXJwcm9tcHRz
```

## 🐛 Troubleshooting

### Port already in use
```bash
# Change port in .env
PORT=8001
```

### Database locked
```bash
# Delete and reinitialize
rm -rf data/
npm run dev
```

### OpenAI API errors
- Check API key in `.env`
- Verify OpenAI account has credits
- Check rate limits

### ChromaDB errors
```bash
# Clear vector store
rm -rf data/chroma/
```

## 📝 Development Notes

- TypeScript strict mode enabled
- ESM modules (not CommonJS)
- Path aliases configured (@/* = src/*)
- Zod for runtime validation
- sql.js for cross-platform SQLite
- Fastify plugins for modularity

## 🚀 Deployment

For local-only use:
1. Build: `npm run build`
2. Start: `npm start`
3. Access at `http://localhost:8000`

## 📄 License

MIT License - see LICENSE file

## 🤝 Contributing

This is a local-only project. For modifications:
1. Create feature branch
2. Make changes
3. Test thoroughly
4. Document changes

---

**PowerPrompts** - Optimize your prompts with AI 🚀
