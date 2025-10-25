# Local Deployment Guide - PowerPrompts

**Version:** 1.0  
**Date:** October 19, 2025  
**Status:** Planning Phase

## 1. Prerequisites

### System Requirements

- **Operating System:** Windows 10/11, macOS 12+, or Linux (Ubuntu 20.04+)
- **RAM:** Minimum 4GB, recommended 8GB
- **Storage:** 5GB free space (including data and vectors)
- **Internet:** Stable connection for OpenAI API calls

### Required Software

**Python 3.11+**

- Check version: `python --version` or `python3 --version`
- Download: https://www.python.org/downloads/

**Node.js 18+**

- Check version: `node --version`
- Download: https://nodejs.org/

**Git** (optional, for cloning repository)

- Check version: `git --version`
- Download: https://git-scm.com/

### Required API Keys

**OpenAI API Key** (Required)

- Sign up at https://platform.openai.com/
- Navigate to API Keys section
- Create new key and save it securely
- Ensure you have credits available

**Arize Phoenix** (Optional)

- No API key needed for local deployment
- Runs as local server on port 6006

---

## 2. Installation Steps

### 2.1 Clone or Download Project

**Option A: Using Git**

```bash
git clone https://github.com/yourusername/PowerPrompts.git
cd PowerPrompts
```

**Option B: Download ZIP**

1. Download project ZIP file
2. Extract to desired location
3. Open terminal in project directory

### 2.2 Backend Setup

#### Step 1: Navigate to Backend Directory

```bash
cd backend
```

#### Step 2: Create Virtual Environment

**Windows:**

```bash
python -m venv venv
venv\Scripts\activate
```

**macOS/Linux:**

```bash
python3 -m venv venv
source venv/bin/activate
```

You should see `(venv)` prefix in your terminal.

#### Step 3: Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

This will install:

- FastAPI & Uvicorn (API server)
- OpenAI SDK (LLM integration)
- ChromaDB (vector store)
- SQLAlchemy & aiosqlite (database)
- Pandas & NumPy (data processing)
- Arize Phoenix (observability)
- Pydantic (validation)
- And all other dependencies

**Installation time:** 2-5 minutes depending on internet speed

#### Step 4: Create Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

**Windows users:** If `cp` doesn't work, manually copy the file:

```bash
copy .env.example .env
```

Edit `.env` file with your configuration:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# Backend API Authentication
API_KEY=your-secure-api-key-here-generate-random-string

# Database Configuration
DATABASE_URL=sqlite:///./powerprompts.db

# ChromaDB Configuration
CHROMADB_PERSIST_DIRECTORY=./.chroma

# Arize Phoenix (Optional)
PHOENIX_ENABLED=true
PHOENIX_URL=http://localhost:6006

# Application Config
APP_NAME=PowerPrompts
APP_VERSION=1.0.0
```

**Security Note:**

- Never commit `.env` file to version control
- Generate a strong random string for `API_KEY`
- Keep your OpenAI API key private

**Generate Random API Key (Optional):**

```python
# Python one-liner to generate secure API key
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

#### Step 5: Initialize Database

```bash
python -m app.db.database
```

This creates `powerprompts.db` SQLite database file with all required tables.

**Verify database creation:**

```bash
ls -l powerprompts.db  # macOS/Linux
dir powerprompts.db    # Windows
```

#### Step 6: Test Backend Installation

```bash
# Start the server
uvicorn app.main:app --reload --port 8000
```

**Expected output:**

```
INFO:     Will watch for changes in these directories: ['/path/to/backend']
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using StatReload
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Test the health endpoint:**

Open browser and navigate to: http://localhost:8000/health

You should see:

```json
{
  "status": "healthy",
  "services": {
    "database": {
      "status": "up",
      "type": "sqlite",
      "path": "./powerprompts.db"
    },
    "vector_store": { "status": "up", "type": "chromadb", "collections": 0 },
    "llm_api": {
      "status": "up",
      "provider": "openai",
      "model": "gpt-4-turbo-preview"
    },
    "arize_phoenix": { "status": "up", "url": "http://localhost:6006" }
  },
  "version": "1.0.0"
}
```

**Test API documentation:**

- Navigate to: http://localhost:8000/docs
- You should see interactive Swagger UI with all endpoints

**Keep this terminal running** for the backend server.

### 2.3 Frontend Setup

**Open a new terminal window** (keep backend running in the first terminal).

#### Step 1: Navigate to Frontend Directory

```bash
cd frontend  # From project root
```

#### Step 2: Install Dependencies

```bash
npm install
```

This will install:

- Next.js 15 (React framework)
- TypeScript (type safety)
- Zustand (state management)
- Base UI (component library)
- Tailwind CSS (styling)
- Recharts (data visualization)
- And all other dependencies

**Installation time:** 2-5 minutes

#### Step 3: Create Environment Configuration

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

**Windows users:**

```bash
copy .env.local.example .env.local
```

Edit `.env.local` file:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# API Key (must match backend .env API_KEY)
NEXT_PUBLIC_API_KEY=your-secure-api-key-here-same-as-backend
```

**Important:** The `NEXT_PUBLIC_API_KEY` must match the `API_KEY` from backend `.env`.

#### Step 4: Start Development Server

```bash
npm run dev
```

**Expected output:**

```
   ▲ Next.js 15.0.0
   - Local:        http://localhost:3000
   - Environments: .env.local

 ✓ Ready in 2.5s
```

**Open browser:** http://localhost:3000

You should see the PowerPrompts interface!

### 2.4 Arize Phoenix Setup (Optional)

Arize Phoenix provides observability for LLM calls and optimization sessions.

**Open a third terminal window:**

#### Install Phoenix

```bash
pip install arize-phoenix
```

#### Start Phoenix Server

```bash
python -m arize.phoenix.server
```

**Expected output:**

```
INFO: Phoenix server running on http://localhost:6006
```

**Access Phoenix UI:** http://localhost:6006

You'll see:

- LLM trace logs
- Token usage statistics
- Latency metrics
- Cost tracking
- Session timelines

**Note:** Phoenix is optional. If disabled, set `PHOENIX_ENABLED=false` in backend `.env`.

---

## 3. Running the Full Stack

### Terminal Layout

You should have **2-3 terminal windows** open:

**Terminal 1: Backend (Required)**

```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn app.main:app --reload --port 8000
```

- Backend API on http://localhost:8000
- API docs at http://localhost:8000/docs

**Terminal 2: Frontend (Required)**

```bash
cd frontend
npm run dev
```

- Frontend UI on http://localhost:3000

**Terminal 3: Arize Phoenix (Optional)**

```bash
python -m arize.phoenix.server
```

- Phoenix UI on http://localhost:6006

### Quick Start Commands

Create a shell script for easy startup:

**`start.sh` (macOS/Linux):**

```bash
#!/bin/bash
# Start Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

# Start Frontend
cd ../frontend
npm run dev &
FRONTEND_PID=$!

# Start Phoenix (optional)
python -m arize.phoenix.server &
PHOENIX_PID=$!

# Wait for Ctrl+C
echo "PowerPrompts is running!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "Phoenix: http://localhost:6006"
echo "Press Ctrl+C to stop all services"

trap "kill $BACKEND_PID $FRONTEND_PID $PHOENIX_PID" EXIT
wait
```

**Make executable:**

```bash
chmod +x start.sh
./start.sh
```

**`start.bat` (Windows):**

```batch
@echo off
cd backend
call venv\Scripts\activate
start "Backend" uvicorn app.main:app --reload --port 8000

cd ..\frontend
start "Frontend" npm run dev

start "Phoenix" python -m arize.phoenix.server

echo PowerPrompts is running!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo Phoenix: http://localhost:6006
```

---

## 4. First-Time Usage Guide

### Step 1: Access the Application

Open browser: http://localhost:3000

### Step 2: Enter a Prompt

In the main text area, enter your prompt:

```
Write a technical blog post explaining how neural networks work
```

### Step 3: Select Framework

Choose optimization framework from dropdown:

- **RACE** (Recommended for beginners)
- COSTAR (Content creation)
- APE (Quick optimization)
- CREATE (Complex tasks)

### Step 4: Enable Techniques (Optional)

Toggle techniques you want to apply:

- ☑ Chain-of-Thought (Improves reasoning)
- ☑ RSIP (Recursive improvement)
- ☐ Self-Consistency (For reliability)
- ☐ Tree of Thoughts (For complex problems)
- ☐ RAG (For factual accuracy - requires uploaded documents)

### Step 5: Adjust Parameters (Optional)

Expand "Advanced Parameters":

- **Temperature:** 0.7 (default) - Lower = more focused, Higher = more creative
- **Top-P:** 0.9 (default) - Nucleus sampling
- **Max Tokens:** 2000 (default) - Maximum response length
- **Model:** gpt-4-turbo-preview (default)

### Step 6: Start Optimization

Click **"Optimize"** button

### Step 7: Watch Real-Time Progress

You'll see:

- Progress bar (1/5, 2/5, ...)
- Live metrics updating
- Event log with status updates
- Estimated time remaining

**Note:** First optimization takes ~2-5 minutes depending on:

- Prompt complexity
- Number of techniques enabled
- OpenAI API response time
- Number of dataset examples

### Step 8: Review Results

After completion:

- **Best Version:** Iteration with highest aggregate score
- **Improvement:** Percentage increase from original
- **Metrics Dashboard:** Charts showing metric evolution
- **Version Comparison:** Side-by-side diff view

### Step 9: Export Optimized Prompt

Click **"Export"** button:

- Select format (JSON, Markdown, or Plain Text)
- Choose what to include (metrics, critique, parameters)
- Download or copy to clipboard

---

## 5. Configuration Options

### Backend Configuration (`backend/.env`)

```env
# === OpenAI Configuration ===
OPENAI_API_KEY=sk-...           # Required: Your OpenAI API key
OPENAI_ORG_ID=                   # Optional: Organization ID
OPENAI_MAX_RETRIES=3             # Retry attempts on failure
OPENAI_TIMEOUT=60                # Request timeout in seconds

# === Authentication ===
API_KEY=                         # Required: Backend API authentication

# === Database ===
DATABASE_URL=sqlite:///./powerprompts.db  # SQLite database path
DATABASE_ECHO=false                       # Log SQL queries (debug)

# === ChromaDB ===
CHROMADB_PERSIST_DIRECTORY=./.chroma  # Vector storage location
CHROMADB_ANONYMIZED_TELEMETRY=false   # Disable telemetry

# === Arize Phoenix ===
PHOENIX_ENABLED=true             # Enable/disable observability
PHOENIX_URL=http://localhost:6006
PHOENIX_PROJECT_NAME=PowerPrompts

# === Application ===
APP_NAME=PowerPrompts
APP_VERSION=1.0.0
LOG_LEVEL=INFO                   # DEBUG, INFO, WARNING, ERROR
CORS_ORIGINS=http://localhost:3000  # Comma-separated allowed origins

# === Optimization Defaults ===
DEFAULT_MODEL=gpt-4-turbo-preview
DEFAULT_TEMPERATURE=0.7
DEFAULT_DATASET_SIZE=15
DEFAULT_ITERATIONS=5
```

### Frontend Configuration (`frontend/.env.local`)

```env
# === Backend API ===
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_KEY=              # Must match backend API_KEY

# === Feature Flags ===
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_PHOENIX=true

# === UI Configuration ===
NEXT_PUBLIC_DEFAULT_FRAMEWORK=RACE
NEXT_PUBLIC_MAX_PROMPT_LENGTH=10000
NEXT_PUBLIC_AUTO_SAVE_INTERVAL=30000  # 30 seconds in ms
```

---

## 6. Data Storage and Persistence

### Database Location

- **File:** `backend/powerprompts.db`
- **Type:** SQLite (single file)
- **Size:** Grows with usage (~10MB per 100 prompts)

### Vector Store Location

- **Directory:** `backend/.chroma/`
- **Type:** ChromaDB persistent storage
- **Size:** Varies based on RAG documents (~1MB per 1000 documents)

### Backup Strategy

**Manual Backup:**

```bash
# Backup database
cp backend/powerprompts.db backend/powerprompts_backup_$(date +%Y%m%d).db

# Backup vector store
tar -czf backend/chroma_backup_$(date +%Y%m%d).tar.gz backend/.chroma/
```

**Scheduled Backup (Linux/macOS):**

Add to crontab (`crontab -e`):

```bash
# Daily backup at 2 AM
0 2 * * * cd /path/to/PowerPrompts && ./backup.sh
```

**`backup.sh`:**

```bash
#!/bin/bash
BACKUP_DIR="./backups/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR
cp backend/powerprompts.db $BACKUP_DIR/
tar -czf $BACKUP_DIR/chroma.tar.gz backend/.chroma/
echo "Backup completed: $BACKUP_DIR"
```

### Restore from Backup

```bash
# Restore database
cp backend/powerprompts_backup_20251019.db backend/powerprompts.db

# Restore vector store
tar -xzf backend/chroma_backup_20251019.tar.gz -C backend/
```

---

## 7. Troubleshooting

### Backend Issues

**Problem: "Module not found" error**

```
ModuleNotFoundError: No module named 'fastapi'
```

**Solution:**

```bash
cd backend
source venv/bin/activate  # Ensure venv is activated
pip install -r requirements.txt
```

**Problem: "Database is locked"**

```
sqlite3.OperationalError: database is locked
```

**Solution:**

- Close all terminals accessing the database
- Restart backend server
- If persists, delete `powerprompts.db` and re-initialize

**Problem: OpenAI API errors**

```
openai.error.RateLimitError: Rate limit exceeded
```

**Solution:**

- Check API key is valid and has credits
- Wait 1-2 minutes and retry
- Reduce concurrent requests
- Upgrade OpenAI plan if needed

**Problem: Port 8000 already in use**

```
ERROR: [Errno 48] Address already in use
```

**Solution:**

```bash
# Find process using port 8000
lsof -i :8000          # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill the process
kill -9 <PID>          # macOS/Linux
taskkill /PID <PID> /F # Windows

# Or use different port
uvicorn app.main:app --reload --port 8001
```

### Frontend Issues

**Problem: "Cannot connect to backend"**

```
Error: Failed to fetch
```

**Solution:**

1. Verify backend is running: http://localhost:8000/health
2. Check `NEXT_PUBLIC_API_URL` in `.env.local` matches backend URL
3. Check `NEXT_PUBLIC_API_KEY` matches backend `API_KEY`
4. Ensure no firewall blocking connections

**Problem: Port 3000 already in use**

```
Port 3000 is already in use
```

**Solution:**

```bash
# Kill process on port 3000
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9  # macOS/Linux

# Or use different port
npm run dev -- -p 3001
```

**Problem: "Hydration error" in console**

```
Warning: Text content did not match
```

**Solution:**

- This is usually harmless in development
- Clear browser cache
- Restart dev server
- Check for server/client rendering mismatches

### ChromaDB Issues

**Problem: "ChromaDB connection error"**

```
chromadb.errors.ChromaError
```

**Solution:**

- Delete `.chroma/` directory and restart backend
- Ensure sufficient disk space
- Check directory permissions

### Phoenix Issues

**Problem: Phoenix not showing traces**
**Solution:**

- Verify `PHOENIX_ENABLED=true` in backend `.env`
- Restart backend server
- Check Phoenix server is running: http://localhost:6006
- Ensure firewall not blocking port 6006

---

## 8. Performance Optimization Tips

### Backend Performance

- **Use caching:** Enable Redis for repeated queries (future enhancement)
- **Batch requests:** Process multiple examples in parallel
- **Connection pooling:** Reuse OpenAI API connections
- **Database indexing:** Already optimized in schema

### Frontend Performance

- **Code splitting:** Automatically handled by Next.js
- **Memoization:** Use React.memo for heavy components
- **Virtual scrolling:** For large version history lists
- **Debounce inputs:** Autosave every 30s, not on every keystroke

### OpenAI API Cost Optimization

- **Use GPT-3.5-turbo for development/testing**
  - Change `DEFAULT_MODEL=gpt-3.5-turbo` in backend `.env`
  - ~10x cheaper than GPT-4
- **Reduce dataset size for testing**
  - Change `DEFAULT_DATASET_SIZE=5` instead of 15
- **Cache evaluation results**
  - Implemented in evaluator service
- **Monitor usage in OpenAI dashboard**
  - https://platform.openai.com/usage

---

## 9. Updating the Application

### Update Backend Dependencies

```bash
cd backend
source venv/bin/activate
pip install --upgrade -r requirements.txt
```

### Update Frontend Dependencies

```bash
cd frontend
npm update
```

### Update to New Version

```bash
git pull origin main  # If using Git
pip install -r backend/requirements.txt
cd frontend && npm install
```

### Database Migrations

If schema changes in updates:

```bash
cd backend
python -m app.db.migrate  # Future: migration script
```

---

## 10. Stopping the Application

### Graceful Shutdown

- **Ctrl+C** in each terminal window
- Backend will close database connections
- Frontend will stop development server
- Phoenix will shutdown gracefully

### Force Stop (if hung)

**macOS/Linux:**

```bash
# Kill all processes
pkill -f "uvicorn app.main:app"
pkill -f "npm run dev"
pkill -f "arize.phoenix.server"
```

**Windows:**

```bash
# Kill specific processes
taskkill /F /IM python.exe
taskkill /F /IM node.exe
```

---

## 11. Security Considerations

### Local-Only Deployment

- Application runs entirely on your machine
- No data sent to external servers (except OpenAI API calls)
- API key authentication prevents unauthorized local access

### Best Practices

- ✅ Keep API keys in `.env` files (never commit)
- ✅ Use strong random strings for `API_KEY`
- ✅ Regularly update dependencies for security patches
- ✅ Backup database before major updates
- ✅ Monitor OpenAI API usage for unexpected charges
- ❌ Never share your `.env` files
- ❌ Never commit API keys to version control
- ❌ Never expose ports to public internet without additional security

### Network Security

If you want to access from other devices on your local network:

```bash
# Backend: Bind to all interfaces
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Frontend: Already accessible on network
# Access via http://<your-ip>:3000
```

**Security warning:** Only do this on trusted networks.

---

## 12. Getting Help

### Documentation

- **Requirements:** `docs/01-requirements.md`
- **Architecture:** `docs/02-architecture.md`
- **API Specification:** `docs/03-api-specification.md`
- **Data Models:** `docs/04-data-models.md`

### Logs and Debugging

- **Backend logs:** Terminal output from uvicorn
- **Frontend logs:** Browser console (F12)
- **Database queries:** Set `DATABASE_ECHO=true` in `.env`
- **API requests:** Check Network tab in browser DevTools

### Common Questions

**Q: How much does it cost to run?**
A: Only OpenAI API costs. Typical optimization:

- GPT-4: $0.50-$2.00 per optimization (15 examples, 5 iterations)
- GPT-3.5-turbo: $0.05-$0.20 per optimization
- Local compute: Free

**Q: Can I use without internet?**
A: No, requires internet for OpenAI API calls. All other components run locally.

**Q: How many prompts can I optimize?**
A: Unlimited. Storage grows ~10MB per 100 prompts with full history.

**Q: Can multiple people use it?**
A: Not simultaneously in MVP. Future versions will support multi-user with authentication.

---

## 13. Uninstallation

### Remove Application

```bash
# Delete project directory
rm -rf /path/to/PowerPrompts  # macOS/Linux
rmdir /s /q C:\path\to\PowerPrompts  # Windows
```

### Remove Virtual Environment

Already deleted with project directory.

### Remove Global Packages (if installed globally)

```bash
pip uninstall arize-phoenix
```

### Clean npm cache (optional)

```bash
npm cache clean --force
```

---

**Document Status:** Approved for Implementation  
**Last Updated:** October 19, 2025  
**Support:** For issues, check troubleshooting section or refer to other documentation files

**Happy Optimizing! 🚀**
