/**
 * RAG (Retrieval-Augmented Generation) Service
 * Manages document storage, chunking, and retrieval for RAG
 */

import { nanoid } from 'nanoid';
import { vectorStore } from '../core/vector-store.js';
import {
  createDocument,
  createDocumentChunk,
  getDocumentsByCollection,
} from '../db/crud.js';

/**
 * RAG Service class
 */
export class RAGService {
  /**
   * Chunk text into smaller segments
   */
  private chunkText(text: string, chunkSize: number = 500, overlap: number = 50): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      chunks.push(text.slice(start, end));
      start = end - overlap;
    }

    return chunks;
  }

  /**
   * Upload and process a document
   */
  async uploadDocument(
    collectionName: string,
    title: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    console.log(`[RAG] Uploading document "${title}" to collection "${collectionName}"...`);

    // Store document in database
    const documentId = await createDocument({
      collectionName,
      title,
      content,
      metadata,
    });

    // Chunk the document
    const chunks = this.chunkText(content);
    console.log(`[RAG] Created ${chunks.length} chunks`);

    // Store chunks and generate embeddings
    const vectorDocs = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (!chunk) continue; // Skip empty chunks
      
      const chunkId = nanoid();
      
      // Store chunk in database
      await createDocumentChunk({
        documentId,
        chunkIndex: i,
        chunkText: chunk,
        embeddingId: chunkId,
      });

      // Prepare for vector store
      vectorDocs.push({
        id: chunkId,
        text: chunk,
        metadata: {
          documentId,
          chunkIndex: i,
          title,
          ...metadata,
        },
      });
    }

    // Add to vector store
    await vectorStore.addDocuments(collectionName, vectorDocs);

    console.log(`[RAG] Document "${title}" uploaded successfully`);

    return documentId;
  }

  /**
   * Search documents in a collection
   */
  async search(
    collectionName: string,
    query: string,
    topK: number = 5
  ): Promise<Array<{
    id: string;
    text: string;
    metadata: Record<string, any>;
    distance: number;
  }>> {
    console.log(`[RAG] Searching collection "${collectionName}" for: "${query.substring(0, 50)}..."`);

    const results = await vectorStore.query(collectionName, query, { topK });

    console.log(`[RAG] Found ${results.length} results`);

    return results;
  }

  /**
   * List all documents in a collection
   */
  async listDocuments(collectionName: string): Promise<Array<{
    id: string;
    title: string;
    created_at: string;
  }>> {
    const documents = await getDocumentsByCollection(collectionName);

    return documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      created_at: doc.created_at,
    }));
  }

  /**
   * Get collection count
   */
  async getCollectionCount(collectionName: string): Promise<number> {
    return await vectorStore.getCollectionCount(collectionName);
  }

  /**
   * List all collections
   */
  async listCollections(): Promise<string[]> {
    return await vectorStore.listCollections();
  }
}

/**
 * Global RAG service instance
 */
export const ragService = new RAGService();

