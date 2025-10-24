-- PowerPrompts Database Schema
-- SQLite database for storing prompts, versions, datasets, and documents

-- Prompts table: Stores original user prompts
CREATE TABLE IF NOT EXISTS prompts (
    id TEXT PRIMARY KEY,
    original_prompt TEXT NOT NULL,
    selected_framework TEXT NOT NULL, -- RACE, COSTAR, APE, CREATE
    techniques_enabled TEXT NOT NULL, -- JSON array of enabled techniques
    parameters_json TEXT NOT NULL, -- JSON object with LLM parameters
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Versions table: Stores prompt versions from each iteration
CREATE TABLE IF NOT EXISTS versions (
    id TEXT PRIMARY KEY,
    prompt_id TEXT NOT NULL,
    iteration_number INTEGER NOT NULL,
    prompt_text TEXT NOT NULL,
    metrics_json TEXT NOT NULL, -- JSON object with all 5 metrics
    evaluation_details TEXT, -- JSON object with per-example breakdown
    techniques_applied TEXT, -- JSON array of techniques used
    critique TEXT, -- RSIP critique
    improvements TEXT, -- RSIP improvements summary
    created_at TEXT NOT NULL,
    FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
);

-- Datasets table: Stores generated evaluation datasets
CREATE TABLE IF NOT EXISTS datasets (
    id TEXT PRIMARY KEY,
    prompt_id TEXT NOT NULL,
    domain TEXT NOT NULL, -- Identified domain/task type
    example_count INTEGER NOT NULL,
    difficulty_levels TEXT NOT NULL, -- JSON array of difficulty levels
    criteria_json TEXT NOT NULL, -- JSON array of evaluation criteria
    created_at TEXT NOT NULL,
    FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
);

-- Examples table: Individual examples in a dataset
CREATE TABLE IF NOT EXISTS examples (
    id TEXT PRIMARY KEY,
    dataset_id TEXT NOT NULL,
    input_text TEXT NOT NULL,
    expected_output TEXT,
    difficulty TEXT NOT NULL, -- easy, medium, hard
    metadata_json TEXT, -- Additional metadata
    created_at TEXT NOT NULL,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
);

-- Documents table: RAG document storage
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    collection_name TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata_json TEXT, -- JSON object with document metadata
    created_at TEXT NOT NULL
);

-- Document chunks table: Chunked documents for RAG
CREATE TABLE IF NOT EXISTS document_chunks (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding_id TEXT, -- ChromaDB embedding ID
    created_at TEXT NOT NULL,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_versions_prompt_id ON versions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_versions_iteration ON versions(iteration_number);
CREATE INDEX IF NOT EXISTS idx_datasets_prompt_id ON datasets(prompt_id);
CREATE INDEX IF NOT EXISTS idx_examples_dataset_id ON examples(dataset_id);
CREATE INDEX IF NOT EXISTS idx_documents_collection ON documents(collection_name);
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON document_chunks(document_id);

