# Testing Strategy - PowerPrompts

**Version:** 1.0  
**Date:** October 19, 2025  
**Status:** Planning Phase

## 1. Testing Philosophy

### Core Principles
- **Test behavior, not implementation:** Focus on user-facing functionality and API contracts
- **Test pyramid approach:** Many unit tests, fewer integration tests, minimal E2E tests
- **Test early, test often:** Write tests alongside implementation
- **Fail fast:** Tests should run quickly and fail immediately on errors
- **Maintainable tests:** Clear, readable test code that's easy to update

### Quality Goals
- **Backend test coverage:** 85%+ for services and core logic
- **Frontend test coverage:** 75%+ for components and utilities
- **Critical path coverage:** 100% for optimization pipeline and API routes
- **Performance benchmarks:** Establish and monitor baseline performance

---

## 2. Backend Testing Strategy (Python + pytest)

### 2.1 Test Environment Setup

**Tool Stack:**
- `pytest` - Test framework
- `pytest-asyncio` - Async test support
- `pytest-cov` - Coverage reporting
- `pytest-mock` - Mocking utilities
- `httpx` - Async HTTP client for API testing
- `faker` - Test data generation

**Configuration:** `backend/pytest.ini`
```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
asyncio_mode = auto
addopts = 
    --cov=app
    --cov-report=html
    --cov-report=term-missing
    --cov-fail-under=85
    -v
    -s
```

**Fixtures:** `backend/tests/conftest.py`
```python
import pytest
import asyncio
from httpx import AsyncClient
from app.main import app
from app.core.llm_client import LLMClient
from app.core.vector_store import VectorStore
from app.db.database import init_db, get_db

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="function")
async def test_db():
    """Create test database."""
    await init_db()
    async with get_db() as db:
        yield db
        # Cleanup after test
        await db.execute("DELETE FROM prompts")
        await db.execute("DELETE FROM versions")
        await db.execute("DELETE FROM datasets")
        await db.commit()

@pytest.fixture
def mock_llm_client(mocker):
    """Mock LLM client to avoid API calls."""
    client = mocker.Mock(spec=LLMClient)
    client.complete = mocker.AsyncMock(return_value="Mocked response")
    client.embed = mocker.AsyncMock(return_value=[0.1] * 1536)
    return client

@pytest.fixture
async def api_client():
    """Create test API client."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
```

### 2.2 Unit Tests

#### Framework Builder Tests
**File:** `backend/tests/services/test_framework_builder.py`

**Test Cases:**
```python
import pytest
from app.services.framework_builder import FrameworkBuilder

class TestFrameworkBuilder:
    @pytest.mark.asyncio
    async def test_build_race_structure(self, mock_llm_client):
        """Test RACE framework produces valid structure."""
        builder = FrameworkBuilder(mock_llm_client)
        prompt = "Write a blog post about AI"
        
        result = await builder.build_race(prompt)
        
        # Assertions
        assert "<role>" in result and "</role>" in result
        assert "<action>" in result and "</action>" in result
        assert "<context>" in result and "</context>" in result
        assert "<expectations>" in result and "</expectations>" in result
        assert "<examples>" in result and "</examples>" in result
    
    @pytest.mark.asyncio
    async def test_build_costar_structure(self, mock_llm_client):
        """Test COSTAR framework produces valid structure."""
        builder = FrameworkBuilder(mock_llm_client)
        prompt = "Create a marketing email"
        
        result = await builder.build_costar(prompt)
        
        # Assertions
        assert "<context>" in result
        assert "<objective>" in result
        assert "<style>" in result
        assert "<tone>" in result
        assert "<audience>" in result
        assert "<response>" in result
    
    @pytest.mark.asyncio
    async def test_preserves_user_intent(self, mock_llm_client):
        """Test framework builder preserves user intent."""
        builder = FrameworkBuilder(mock_llm_client)
        prompt = "Explain quantum computing to a 5-year-old"
        
        result = await builder.build_race(prompt)
        
        # Check key phrases preserved
        assert "quantum computing" in result.lower()
        assert "5-year-old" in result.lower() or "beginner" in result.lower()
```

#### Evaluator Tests
**File:** `backend/tests/services/test_evaluator.py`

**Test Cases:**
```python
import pytest
from app.services.evaluator import Evaluator

class TestEvaluator:
    @pytest.mark.asyncio
    async def test_calculate_relevance(self, mock_llm_client):
        """Test relevance calculation."""
        evaluator = Evaluator(mock_llm_client)
        
        response = "AI is artificial intelligence..."
        expected = "Explain AI briefly"
        
        score = await evaluator._calculate_relevance(response, expected)
        
        assert 0 <= score <= 100
        assert isinstance(score, float)
    
    @pytest.mark.asyncio
    async def test_aggregate_metrics(self):
        """Test metric aggregation."""
        evaluator = Evaluator(None)
        
        breakdown = [
            Metrics(relevance=80, accuracy=85, consistency=75, efficiency=50, readability=90, aggregate=76),
            Metrics(relevance=90, accuracy=80, consistency=80, efficiency=45, readability=85, aggregate=76),
        ]
        
        result = evaluator.aggregate_metrics(breakdown)
        
        assert result.relevance == 85.0  # Average of 80 and 90
        assert result.accuracy == 82.5
    
    @pytest.mark.asyncio
    async def test_consistency_calculation(self):
        """Test consistency metric calculation."""
        evaluator = Evaluator(None)
        
        response = "AI is artificial intelligence"
        expected = "AI is artificial intelligence"
        
        score = evaluator._calculate_consistency(response, expected)
        
        assert score == 100.0  # Exact match
```

#### Technique Applier Tests
**File:** `backend/tests/services/test_technique_applier.py`

**Test Cases:**
```python
import pytest
from app.services.technique_applier import TechniqueApplier

class TestTechniqueApplier:
    def test_apply_chain_of_thought(self):
        """Test CoT adds reasoning instructions."""
        applier = TechniqueApplier()
        prompt = "<action>Solve math problem</action>"
        
        result = applier.apply_chain_of_thought(prompt)
        
        assert "step by step" in result.lower() or "reasoning" in result.lower()
        assert "<action>Solve math problem</action>" in result  # Preserves original
    
    @pytest.mark.asyncio
    async def test_apply_self_consistency(self, mock_llm_client):
        """Test self-consistency generates multiple paths."""
        applier = TechniqueApplier(mock_llm_client)
        prompt = "What is 2+2?"
        
        # Mock returns different responses
        mock_llm_client.complete.side_effect = ["4", "4", "5"]
        
        result = await applier.apply_self_consistency(prompt, paths=3)
        
        assert result == "4"  # Majority vote
        assert mock_llm_client.complete.call_count == 3
    
    @pytest.mark.asyncio
    async def test_apply_rsip_improves_prompt(self, mock_llm_client):
        """Test RSIP generates improved versions."""
        applier = TechniqueApplier(mock_llm_client)
        prompt = "Write an essay"
        
        # Mock critique and improvement
        mock_llm_client.complete.side_effect = [
            "Critique: Too vague, lacks structure",
            "Improved: Write a 5-paragraph essay about...",
        ]
        
        result = await applier.apply_rsip(prompt, iterations=1)
        
        assert len(result.iterations) == 1
        assert result.iterations[0].critique is not None
        assert result.iterations[0].improved_prompt != prompt
```

#### Dataset Generator Tests
**File:** `backend/tests/services/test_dataset_generator.py`

**Test Cases:**
```python
import pytest
from app.services.dataset_generator import DatasetGenerator

class TestDatasetGenerator:
    @pytest.mark.asyncio
    async def test_generate_dataset(self, mock_llm_client, test_db):
        """Test dataset generation produces diverse examples."""
        generator = DatasetGenerator(mock_llm_client, test_db)
        
        prompt = "Write a blog post about AI"
        dataset = await generator.generate(prompt, count=10)
        
        assert len(dataset.examples) == 10
        assert len(dataset.criteria) >= 5
        assert dataset.dataset_id.startswith("ds_")
    
    @pytest.mark.asyncio
    async def test_examples_are_diverse(self, mock_llm_client, test_db):
        """Test generated examples have variety."""
        generator = DatasetGenerator(mock_llm_client, test_db)
        
        dataset = await generator.generate("Explain science", count=15)
        
        # Check difficulty levels vary
        difficulties = [ex.difficulty for ex in dataset.examples]
        assert "beginner" in difficulties
        assert "advanced" in difficulties
        
        # Check inputs are unique
        inputs = [ex.input for ex in dataset.examples]
        assert len(inputs) == len(set(inputs))  # No duplicates
```

### 2.3 Integration Tests

#### Optimization Service Tests
**File:** `backend/tests/integration/test_optimization_service.py`

**Test Cases:**
```python
import pytest
import asyncio
from app.services.optimization_service import OptimizationService
from app.api.models.prompt import OptimizeRequest, LLMParameters

class TestOptimizationService:
    @pytest.mark.asyncio
    async def test_full_optimization_loop(self, mock_llm_client, test_db):
        """Test complete 5-iteration optimization."""
        service = OptimizationService(mock_llm_client, test_db)
        queue = asyncio.Queue()
        
        request = OptimizeRequest(
            prompt="Write a blog post",
            framework="RACE",
            techniques=["rsip"],
            parameters=LLMParameters()
        )
        
        result = await service.optimize(request, queue)
        
        # Assertions
        assert len(result.all_iterations) == 5
        assert 0 <= result.best_version <= 5
        assert result.improvement_percentage >= 0
        
        # Check events were emitted
        events = []
        while not queue.empty():
            events.append(await queue.get())
        
        assert any(e.event == "dataset_generated" for e in events)
        assert sum(e.event == "iteration_complete" for e in events) == 5
        assert any(e.event == "optimization_complete" for e in events)
    
    @pytest.mark.asyncio
    async def test_best_version_selection(self, mock_llm_client, test_db):
        """Test best version is correctly identified."""
        service = OptimizationService(mock_llm_client, test_db)
        queue = asyncio.Queue()
        
        # Mock evaluator to return increasing scores
        # (In reality, would mock the evaluator service)
        
        request = OptimizeRequest(
            prompt="Explain quantum physics",
            framework="RACE",
            techniques=[]
        )
        
        result = await service.optimize(request, queue)
        
        # Best version should have highest aggregate score
        best = result.all_iterations[result.best_version]
        for iteration in result.all_iterations:
            assert best.metrics.aggregate >= iteration.metrics.aggregate
```

#### API Route Tests
**File:** `backend/tests/integration/test_api_routes.py`

**Test Cases:**
```python
import pytest

class TestOptimizationAPI:
    @pytest.mark.asyncio
    async def test_optimize_endpoint_sse_stream(self, api_client):
        """Test /api/optimize returns SSE stream."""
        request_data = {
            "prompt": "Write a technical blog post about databases",
            "framework": "RACE",
            "techniques": ["cot", "rsip"],
            "parameters": {
                "temperature": 0.7,
                "top_p": 0.9,
                "max_tokens": 2000,
                "model": "gpt-4-turbo-preview"
            }
        }
        
        async with api_client.stream("POST", "/api/optimize", json=request_data) as response:
            assert response.status_code == 200
            assert response.headers["content-type"] == "text/event-stream"
            
            events = []
            async for line in response.aiter_lines():
                if line.startswith("event:"):
                    event_type = line.split(":")[1].strip()
                    events.append(event_type)
            
            assert "dataset_generated" in events
            assert "iteration_complete" in events
            assert "optimization_complete" in events
    
    @pytest.mark.asyncio
    async def test_authentication_required(self, api_client):
        """Test API key authentication is enforced."""
        response = await api_client.post(
            "/api/datasets/generate",
            json={"prompt": "Test"}
        )
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_validation_errors(self, api_client):
        """Test request validation."""
        response = await api_client.post(
            "/api/optimize",
            json={"prompt": "Hi"},  # Too short
            headers={"X-API-Key": "test-key"}
        )
        
        assert response.status_code == 400
        assert "validation" in response.json()["error"]["code"].lower()
```

### 2.4 Performance Tests

**File:** `backend/tests/performance/test_benchmarks.py`

**Test Cases:**
```python
import pytest
import time

class TestPerformance:
    @pytest.mark.asyncio
    async def test_evaluation_speed(self, mock_llm_client, test_db):
        """Test evaluator meets performance target (<2s per example)."""
        evaluator = Evaluator(mock_llm_client)
        
        start = time.time()
        
        for _ in range(10):
            await evaluator.evaluate(
                prompt="Test",
                response="Response",
                expected="Expected",
                criteria=[]
            )
        
        elapsed = time.time() - start
        avg_time = elapsed / 10
        
        assert avg_time < 2.0  # Target: <2s per example
    
    @pytest.mark.asyncio
    async def test_database_query_speed(self, test_db):
        """Test database queries are fast."""
        # Insert test data
        for i in range(100):
            await test_db.execute(
                "INSERT INTO prompts (id, original_prompt, framework) VALUES (?, ?, ?)",
                (f"prm_{i}", "Test prompt", "RACE")
            )
        await test_db.commit()
        
        start = time.time()
        cursor = await test_db.execute("SELECT * FROM prompts WHERE id = ?", ("prm_50",))
        await cursor.fetchone()
        elapsed = time.time() - start
        
        assert elapsed < 0.1  # Target: <100ms for reads
```

---

## 3. Frontend Testing Strategy (TypeScript + Vitest + React Testing Library)

### 3.1 Test Environment Setup

**Tool Stack:**
- `Vitest` - Test framework (faster than Jest)
- `@testing-library/react` - Component testing
- `@testing-library/user-event` - User interaction simulation
- `@testing-library/jest-dom` - DOM matchers
- `msw` - API mocking

**Configuration:** `frontend/vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'src/test/'],
      lines: 75,
      functions: 75,
      branches: 75,
      statements: 75,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Setup File:** `frontend/src/test/setup.ts`
```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

### 3.2 Component Unit Tests

#### PromptInput Tests
**File:** `frontend/src/components/optimizer/prompt-input.test.tsx`

**Test Cases:**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PromptInput from './prompt-input';

describe('PromptInput', () => {
  it('renders textarea with placeholder', () => {
    render(<PromptInput value="" onChange={() => {}} />);
    
    const textarea = screen.getByPlaceholderText(/enter your prompt/i);
    expect(textarea).toBeInTheDocument();
  });
  
  it('displays character count', async () => {
    const user = userEvent.setup();
    render(<PromptInput value="" onChange={() => {}} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Hello World');
    
    expect(screen.getByText(/11 \/ 10000/i)).toBeInTheDocument();
  });
  
  it('calls onChange when typing', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<PromptInput value="" onChange={onChange} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Test');
    
    expect(onChange).toHaveBeenCalled();
  });
  
  it('shows validation error for short input', () => {
    render(<PromptInput value="Hi" onChange={() => {}} error="Too short" />);
    
    expect(screen.getByText(/too short/i)).toBeInTheDocument();
  });
});
```

#### OptimizationProgress Tests
**File:** `frontend/src/components/optimizer/optimization-progress.test.tsx`

**Test Cases:**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import OptimizationProgress from './optimization-progress';

describe('OptimizationProgress', () => {
  it('displays progress bar', () => {
    render(<OptimizationProgress currentIteration={2} totalIterations={5} />);
    
    expect(screen.getByText(/2 \/ 5/i)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '40');
  });
  
  it('shows metrics when provided', () => {
    const metrics = {
      relevance: 80,
      accuracy: 85,
      consistency: 75,
      efficiency: 50,
      readability: 90,
      aggregate: 76,
    };
    
    render(
      <OptimizationProgress 
        currentIteration={1} 
        totalIterations={5}
        metrics={metrics}
      />
    );
    
    expect(screen.getByText(/relevance/i)).toBeInTheDocument();
    expect(screen.getByText(/80/)).toBeInTheDocument();
  });
  
  it('displays completion state', () => {
    render(
      <OptimizationProgress 
        currentIteration={5} 
        totalIterations={5}
        isComplete={true}
      />
    );
    
    expect(screen.getByText(/complete/i)).toBeInTheDocument();
  });
});
```

### 3.3 Store Tests

**File:** `frontend/src/stores/optimization-store.test.ts`

**Test Cases:**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import useOptimizationStore from './optimization-store';

describe('OptimizationStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useOptimizationStore.setState({
      currentPrompt: '',
      framework: null,
      techniques: [],
      iterations: [],
    });
  });
  
  it('sets prompt correctly', () => {
    const { setPrompt } = useOptimizationStore.getState();
    
    setPrompt('Test prompt');
    
    expect(useOptimizationStore.getState().currentPrompt).toBe('Test prompt');
  });
  
  it('toggles techniques', () => {
    const { toggleTechnique } = useOptimizationStore.getState();
    
    toggleTechnique('cot');
    expect(useOptimizationStore.getState().techniques).toContain('cot');
    
    toggleTechnique('cot');
    expect(useOptimizationStore.getState().techniques).not.toContain('cot');
  });
  
  it('adds iteration results', () => {
    const { addIteration } = useOptimizationStore.getState();
    
    const iteration = {
      iteration: 1,
      version_id: 'ver_123',
      prompt: 'Test',
      metrics: { aggregate: 75 },
    };
    
    addIteration(iteration);
    
    expect(useOptimizationStore.getState().iterations).toHaveLength(1);
    expect(useOptimizationStore.getState().currentIteration).toBe(1);
  });
});
```

### 3.4 Integration Tests

**File:** `frontend/src/test/integration/optimization-flow.test.tsx`

**Test Cases:**
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import App from '@/app/page';

// Setup MSW server
const server = setupServer(
  http.post('http://localhost:8000/api/optimize', () => {
    // Return SSE stream
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue('event: iteration_complete\n');
        controller.enqueue('data: {"iteration": 1}\n\n');
        controller.close();
      },
    });
    
    return new HttpResponse(stream, {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  }),
);

beforeAll(() => server.listen());
afterAll(() => server.close());

describe('Optimization Flow', () => {
  it('completes full optimization', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Enter prompt
    const textarea = screen.getByPlaceholderText(/enter your prompt/i);
    await user.type(textarea, 'Write a blog post about AI');
    
    // Select framework
    const frameworkSelect = screen.getByLabelText(/framework/i);
    await user.selectOptions(frameworkSelect, 'RACE');
    
    // Start optimization
    const optimizeButton = screen.getByRole('button', { name: /optimize/i });
    await user.click(optimizeButton);
    
    // Wait for completion
    await waitFor(() => {
      expect(screen.getByText(/complete/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
```

---

## 4. E2E Testing Strategy

### 4.1 Tool: Playwright

**Configuration:** `frontend/playwright.config.ts`
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 4.2 E2E Test Cases

**File:** `frontend/e2e/optimization.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('PowerPrompts E2E', () => {
  test('complete optimization flow', async ({ page }) => {
    await page.goto('/');
    
    // Input prompt
    await page.fill('textarea[placeholder*="prompt"]', 'Explain quantum physics simply');
    
    // Select framework
    await page.selectOption('select[aria-label="Framework"]', 'RACE');
    
    // Enable techniques
    await page.check('input[value="cot"]');
    await page.check('input[value="rsip"]');
    
    // Start optimization
    await page.click('button:has-text("Optimize")');
    
    // Wait for progress
    await expect(page.locator('text=/1 \\/ 5/')).toBeVisible({ timeout: 10000 });
    
    // Wait for completion
    await expect(page.locator('text=/Complete/')).toBeVisible({ timeout: 60000 });
    
    // Check results displayed
    await expect(page.locator('text=/Best Version/')).toBeVisible();
    await expect(page.locator('text=/Aggregate/')).toBeVisible();
  });
  
  test('export functionality', async ({ page }) => {
    // ... navigate to completed optimization ...
    
    // Click export
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export")');
    await page.selectOption('select[aria-label="Format"]', 'markdown');
    await page.click('button:has-text("Download")');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.md');
  });
});
```

---

## 5. Quality Gates and CI/CD Integration

### 5.1 Pre-Commit Hooks

**File:** `.pre-commit-config.yaml`
```yaml
repos:
  - repo: local
    hooks:
      - id: pytest
        name: Run backend tests
        entry: bash -c 'cd backend && pytest --cov --cov-fail-under=85'
        language: system
        pass_filenames: false
        
      - id: vitest
        name: Run frontend tests
        entry: bash -c 'cd frontend && npm run test'
        language: system
        pass_filenames: false
```

### 5.2 GitHub Actions CI

**File:** `.github/workflows/ci.yml`
```yaml
name: CI

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: cd backend && pip install -r requirements.txt
      - run: cd backend && pytest --cov --cov-report=xml
      - uses: codecov/codecov-action@v3
  
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd frontend && npm ci
      - run: cd frontend && npm run test -- --coverage
      - uses: codecov/codecov-action@v3
  
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd frontend && npm ci
      - run: cd frontend && npx playwright install --with-deps
      - run: cd frontend && npm run test:e2e
```

---

## 6. Test Data Management

### Mock Data Factory

**File:** `backend/tests/factories.py`
```python
from faker import Faker
from app.api.models.prompt import OptimizeRequest, LLMParameters

fake = Faker()

class PromptFactory:
    @staticmethod
    def create_optimize_request(**kwargs):
        defaults = {
            "prompt": fake.text(max_nb_chars=200),
            "framework": "RACE",
            "techniques": [],
            "parameters": LLMParameters()
        }
        return OptimizeRequest(**(defaults | kwargs))
    
    @staticmethod
    def create_dataset(**kwargs):
        # ... factory for datasets ...
        pass
```

---

## 7. Testing Best Practices

### Do's
- ✅ Write tests before or during implementation (TDD/BDD)
- ✅ Test behavior and contracts, not implementation details
- ✅ Use descriptive test names that explain what is tested
- ✅ Keep tests independent and isolated
- ✅ Mock external dependencies (LLM API, database)
- ✅ Use fixtures and factories for test data
- ✅ Assert one thing per test
- ✅ Test edge cases and error conditions

### Don'ts
- ❌ Don't test framework code (FastAPI, React internals)
- ❌ Don't make tests dependent on execution order
- ❌ Don't use real API calls in unit tests
- ❌ Don't commit failing tests
- ❌ Don't skip tests to make CI pass
- ❌ Don't test private methods directly
- ❌ Don't write tests that are flaky or non-deterministic

---

**Document Status:** Approved for Implementation  
**Next Steps:** Setup test infrastructure and begin writing tests alongside code

