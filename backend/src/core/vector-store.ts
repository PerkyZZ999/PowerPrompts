/**
 * ChromaDB Vector Store for RAG
 */

import { ChromaClient, Collection } from 'chromadb';
import { appConfig } from '../config.js';
import { llmClient } from './llm-client.js';

/**
 * Vector store document
 */
export interface VectorDocument {
  id: string;
  text: string;
  metadata?: Record<string, any>;
}

/**
 * Query result
 */
export interface QueryResult {
  id: string;
  text: string;
  metadata: Record<string, any>;
  distance: number;
}

/**
 * Vector Store class for ChromaDB operations
 */
export class VectorStore {
  private client: ChromaClient;
  private collections: Map<string, Collection>;

  constructor() {
    this.client = new ChromaClient({
      path: appConfig.chromaPath,
    });
    this.collections = new Map();
  }

  /**
   * Get or create a collection
   */
  async getOrCreateCollection(name: string): Promise<Collection> {
    // Check cache first
    if (this.collections.has(name)) {
      return this.collections.get(name)!;
    }

    try {
      // Try to get existing collection
      const collection = await this.client.getOrCreateCollection({
        name,
        metadata: { 'hnsw:space': 'cosine' },
      });

      // Cache the collection
      this.collections.set(name, collection);

      console.log(`[VECTOR STORE] Collection "${name}" ready`);
      return collection;
    } catch (error) {
      console.error(`[VECTOR STORE ERROR] Failed to get/create collection "${name}":`, error);
      throw error;
    }
  }

  /**
   * Add documents to collection
   */
  async addDocuments(
    collectionName: string,
    documents: VectorDocument[]
  ): Promise<void> {
    if (documents.length === 0) {
      return;
    }

    const collection = await this.getOrCreateCollection(collectionName);

    try {
      // Generate embeddings for all documents
      const embeddings: number[][] = [];
      for (const doc of documents) {
        const embedding = await llmClient.embed(doc.text);
        embeddings.push(embedding);
      }

      // Add to ChromaDB
      await collection.add({
        ids: documents.map((d) => d.id),
        embeddings,
        documents: documents.map((d) => d.text),
        metadatas: documents.map((d) => d.metadata || {}),
      });

      console.log(
        `[VECTOR STORE] Added ${documents.length} documents to collection "${collectionName}"`
      );
    } catch (error) {
      console.error(
        `[VECTOR STORE ERROR] Failed to add documents to collection "${collectionName}":`,
        error
      );
      throw error;
    }
  }

  /**
   * Query collection for similar documents
   */
  async query(
    collectionName: string,
    queryText: string,
    options: {
      topK?: number;
      filter?: Record<string, any>;
    } = {}
  ): Promise<QueryResult[]> {
    const { topK = 5, filter } = options;

    const collection = await this.getOrCreateCollection(collectionName);

    try {
      // Generate query embedding
      const queryEmbedding = await llmClient.embed(queryText);

      // Query ChromaDB
      const results = await collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: topK,
        where: filter,
      });

      // Format results
      const formattedResults: QueryResult[] = [];

      if (results.ids && results.ids[0]) {
        for (let i = 0; i < results.ids[0].length; i++) {
          formattedResults.push({
            id: results.ids[0][i] as string,
            text: (results.documents?.[0]?.[i] as string) || '',
            metadata: (results.metadatas?.[0]?.[i] as Record<string, any>) || {},
            distance: (results.distances?.[0]?.[i] as number) || 0,
          });
        }
      }

      console.log(
        `[VECTOR STORE] Query returned ${formattedResults.length} results from collection "${collectionName}"`
      );

      return formattedResults;
    } catch (error) {
      console.error(
        `[VECTOR STORE ERROR] Failed to query collection "${collectionName}":`,
        error
      );
      throw error;
    }
  }

  /**
   * Delete documents from collection
   */
  async deleteDocuments(
    collectionName: string,
    ids: string[]
  ): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    const collection = await this.getOrCreateCollection(collectionName);

    try {
      await collection.delete({
        ids,
      });

      console.log(
        `[VECTOR STORE] Deleted ${ids.length} documents from collection "${collectionName}"`
      );
    } catch (error) {
      console.error(
        `[VECTOR STORE ERROR] Failed to delete documents from collection "${collectionName}":`,
        error
      );
      throw error;
    }
  }

  /**
   * List all collections
   */
  async listCollections(): Promise<string[]> {
    try {
      const collections = await this.client.listCollections();
      return collections.map((c) => {
        if (typeof c === 'string') return c;
        if (c && typeof c === 'object' && 'name' in c) return (c as any).name;
        return String(c);
      });
    } catch (error) {
      console.error('[VECTOR STORE ERROR] Failed to list collections:', error);
      throw error;
    }
  }

  /**
   * Delete a collection
   */
  async deleteCollection(name: string): Promise<void> {
    try {
      await this.client.deleteCollection({ name });
      this.collections.delete(name);
      console.log(`[VECTOR STORE] Deleted collection "${name}"`);
    } catch (error) {
      console.error(
        `[VECTOR STORE ERROR] Failed to delete collection "${name}":`,
        error
      );
      throw error;
    }
  }

  /**
   * Get collection count
   */
  async getCollectionCount(collectionName: string): Promise<number> {
    const collection = await this.getOrCreateCollection(collectionName);

    try {
      const count = await collection.count();
      return count;
    } catch (error) {
      console.error(
        `[VECTOR STORE ERROR] Failed to get count for collection "${collectionName}":`,
        error
      );
      throw error;
    }
  }
}

/**
 * Global vector store instance
 */
export const vectorStore = new VectorStore();

