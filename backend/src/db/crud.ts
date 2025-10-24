/**
 * CRUD operations for database entities
 */

import { nanoid } from 'nanoid';
import { query, execute } from './database.js';

/**
 * Database entity types
 */
export interface DbPrompt {
  id: string;
  original_prompt: string;
  selected_framework: string;
  techniques_enabled: string; // JSON array
  parameters_json: string; // JSON object
  created_at: string;
  updated_at: string;
}

export interface DbVersion {
  id: string;
  prompt_id: string;
  iteration_number: number;
  prompt_text: string;
  metrics_json: string; // JSON object
  evaluation_details: string | null; // JSON object
  techniques_applied: string | null; // JSON array
  critique: string | null;
  improvements: string | null;
  created_at: string;
}

export interface DbDataset {
  id: string;
  prompt_id: string;
  domain: string;
  example_count: number;
  difficulty_levels: string; // JSON array
  criteria_json: string; // JSON array
  created_at: string;
}

export interface DbExample {
  id: string;
  dataset_id: string;
  input_text: string;
  expected_output: string | null;
  difficulty: string;
  metadata_json: string | null; // JSON object
  created_at: string;
}

export interface DbDocument {
  id: string;
  collection_name: string;
  title: string;
  content: string;
  metadata_json: string | null; // JSON object
  created_at: string;
}

export interface DbDocumentChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  chunk_text: string;
  embedding_id: string | null;
  created_at: string;
}

/**
 * Prompts CRUD
 */
export async function createPrompt(data: {
  originalPrompt: string;
  selectedFramework: string;
  techniquesEnabled: string[];
  parameters: any;
}): Promise<string> {
  const id = nanoid();
  const now = new Date().toISOString();

  await execute(
    `INSERT INTO prompts (id, original_prompt, selected_framework, techniques_enabled, parameters_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.originalPrompt,
      data.selectedFramework,
      JSON.stringify(data.techniquesEnabled),
      JSON.stringify(data.parameters),
      now,
      now,
    ]
  );

  return id;
}

export async function getPrompt(id: string): Promise<DbPrompt | null> {
  const results = await query<DbPrompt>('SELECT * FROM prompts WHERE id = ?', [
    id,
  ]);
  return results[0] || null;
}

export async function getAllPrompts(): Promise<DbPrompt[]> {
  return await query<DbPrompt>('SELECT * FROM prompts ORDER BY created_at DESC');
}

export async function updatePrompt(
  id: string,
  data: Partial<{
    techniquesEnabled: string[];
    parameters: any;
  }>
): Promise<void> {
  const updates: string[] = [];
  const params: any[] = [];

  if (data.techniquesEnabled) {
    updates.push('techniques_enabled = ?');
    params.push(JSON.stringify(data.techniquesEnabled));
  }

  if (data.parameters) {
    updates.push('parameters_json = ?');
    params.push(JSON.stringify(data.parameters));
  }

  if (updates.length > 0) {
    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    await execute(
      `UPDATE prompts SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
  }
}

/**
 * Versions CRUD
 */
export async function createVersion(data: {
  promptId: string;
  iterationNumber: number;
  promptText: string;
  metrics: any;
  evaluationDetails?: any;
  techniquesApplied?: string[];
  critique?: string;
  improvements?: string;
}): Promise<string> {
  const id = nanoid();
  const now = new Date().toISOString();

  await execute(
    `INSERT INTO versions (id, prompt_id, iteration_number, prompt_text, metrics_json, evaluation_details, techniques_applied, critique, improvements, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.promptId,
      data.iterationNumber,
      data.promptText,
      JSON.stringify(data.metrics),
      data.evaluationDetails ? JSON.stringify(data.evaluationDetails) : null,
      data.techniquesApplied ? JSON.stringify(data.techniquesApplied) : null,
      data.critique || null,
      data.improvements || null,
      now,
    ]
  );

  return id;
}

export async function getVersion(id: string): Promise<DbVersion | null> {
  const results = await query<DbVersion>('SELECT * FROM versions WHERE id = ?', [
    id,
  ]);
  return results[0] || null;
}

export async function getVersionsByPrompt(
  promptId: string
): Promise<DbVersion[]> {
  return await query<DbVersion>(
    'SELECT * FROM versions WHERE prompt_id = ? ORDER BY iteration_number ASC',
    [promptId]
  );
}

export async function getVersionsByPromptId(
  promptId: string
): Promise<DbVersion[]> {
  return await query<DbVersion>(
    'SELECT * FROM versions WHERE prompt_id = ? ORDER BY iteration_number ASC',
    [promptId]
  );
}

/**
 * Datasets CRUD
 */
export async function createDataset(data: {
  promptId: string;
  domain: string;
  exampleCount: number;
  difficultyLevels: string[];
  criteria: any[];
}): Promise<string> {
  const id = nanoid();
  const now = new Date().toISOString();

  await execute(
    `INSERT INTO datasets (id, prompt_id, domain, example_count, difficulty_levels, criteria_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.promptId,
      data.domain,
      data.exampleCount,
      JSON.stringify(data.difficultyLevels),
      JSON.stringify(data.criteria),
      now,
    ]
  );

  return id;
}

export async function getDataset(id: string): Promise<DbDataset | null> {
  const results = await query<DbDataset>(
    'SELECT * FROM datasets WHERE id = ?',
    [id]
  );
  return results[0] || null;
}

export async function getDatasetsByPrompt(promptId: string): Promise<DbDataset[]> {
  return await query<DbDataset>(
    'SELECT * FROM datasets WHERE prompt_id = ? ORDER BY created_at DESC',
    [promptId]
  );
}

/**
 * Examples CRUD
 */
export async function createExample(data: {
  datasetId: string;
  inputText: string;
  expectedOutput?: string;
  difficulty: string;
  metadata?: any;
}): Promise<string> {
  const id = nanoid();
  const now = new Date().toISOString();

  await execute(
    `INSERT INTO examples (id, dataset_id, input_text, expected_output, difficulty, metadata_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.datasetId,
      data.inputText,
      data.expectedOutput || null,
      data.difficulty,
      data.metadata ? JSON.stringify(data.metadata) : null,
      now,
    ]
  );

  return id;
}

export async function getExamplesByDataset(
  datasetId: string
): Promise<DbExample[]> {
  return await query<DbExample>(
    'SELECT * FROM examples WHERE dataset_id = ? ORDER BY difficulty, created_at ASC',
    [datasetId]
  );
}

/**
 * Documents CRUD
 */
export async function createDocument(data: {
  collectionName: string;
  title: string;
  content: string;
  metadata?: any;
}): Promise<string> {
  const id = nanoid();
  const now = new Date().toISOString();

  await execute(
    `INSERT INTO documents (id, collection_name, title, content, metadata_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.collectionName,
      data.title,
      data.content,
      data.metadata ? JSON.stringify(data.metadata) : null,
      now,
    ]
  );

  return id;
}

export async function getDocument(id: string): Promise<DbDocument | null> {
  const results = await query<DbDocument>(
    'SELECT * FROM documents WHERE id = ?',
    [id]
  );
  return results[0] || null;
}

export async function getDocumentsByCollection(
  collectionName: string
): Promise<DbDocument[]> {
  return await query<DbDocument>(
    'SELECT * FROM documents WHERE collection_name = ? ORDER BY created_at DESC',
    [collectionName]
  );
}

/**
 * Document Chunks CRUD
 */
export async function createDocumentChunk(data: {
  documentId: string;
  chunkIndex: number;
  chunkText: string;
  embeddingId?: string;
}): Promise<string> {
  const id = nanoid();
  const now = new Date().toISOString();

  await execute(
    `INSERT INTO document_chunks (id, document_id, chunk_index, chunk_text, embedding_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.documentId,
      data.chunkIndex,
      data.chunkText,
      data.embeddingId || null,
      now,
    ]
  );

  return id;
}

export async function getChunksByDocument(
  documentId: string
): Promise<DbDocumentChunk[]> {
  return await query<DbDocumentChunk>(
    'SELECT * FROM document_chunks WHERE document_id = ? ORDER BY chunk_index ASC',
    [documentId]
  );
}

export async function updateChunkEmbedding(
  chunkId: string,
  embeddingId: string
): Promise<void> {
  await execute(
    'UPDATE document_chunks SET embedding_id = ? WHERE id = ?',
    [embeddingId, chunkId]
  );
}

