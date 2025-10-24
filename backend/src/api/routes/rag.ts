/**
 * RAG API routes
 */

import { FastifyInstance } from 'fastify';
import { ragService } from '../../services/rag-service.js';
import { z } from 'zod';

const UploadDocumentSchema = z.object({
  collection_name: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
  metadata: z.record(z.any()).optional(),
});

const SearchDocumentsSchema = z.object({
  collection_name: z.string().min(1),
  query: z.string().min(1),
  top_k: z.number().int().min(1).max(20).optional().default(5),
});

/**
 * Register RAG routes
 */
export async function ragRoutes(server: FastifyInstance) {
  /**
   * POST /api/rag/upload
   * Upload a document to a collection
   */
  server.post('/api/rag/upload', async (request, reply) => {
    try {
      const data = UploadDocumentSchema.parse(request.body);

      const documentId = await ragService.uploadDocument(
        data.collection_name,
        data.title,
        data.content,
        data.metadata
      );

      return {
        success: true,
        document_id: documentId,
        message: 'Document uploaded successfully',
      };
    } catch (error: any) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: error.message,
      });
    }
  });

  /**
   * POST /api/rag/search
   * Search documents in a collection
   */
  server.post('/api/rag/search', async (request, reply) => {
    try {
      const data = SearchDocumentsSchema.parse(request.body);

      const results = await ragService.search(
        data.collection_name,
        data.query,
        data.top_k
      );

      return {
        results,
        count: results.length,
      };
    } catch (error: any) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: error.message,
      });
    }
  });

  /**
   * GET /api/rag/collections
   * List all collections
   */
  server.get('/api/rag/collections', async () => {
    try {
      const collections = await ragService.listCollections();

      return {
        collections,
        count: collections.length,
      };
    } catch (error: any) {
      return {
        collections: [],
        count: 0,
        error: error.message,
      };
    }
  });

  /**
   * GET /api/rag/collections/:collectionName/documents
   * List documents in a collection
   */
  server.get<{
    Params: { collectionName: string };
  }>('/api/rag/collections/:collectionName/documents', async (request) => {
    const { collectionName } = request.params;

    const documents = await ragService.listDocuments(collectionName);

    return {
      documents,
      count: documents.length,
    };
  });
}

