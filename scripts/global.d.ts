declare module 'groq-sdk' {
  interface EmbeddingCreateParams {
    model: string;
    input: string | string[];
  }

  interface Embedding {
    embedding: number[];
    index: number;
    object: string;
  }

  interface CreateEmbeddingResponse {
    data: Embedding[];
    model: string;
    object: string;
    usage: {
      prompt_tokens: number;
      total_tokens: number;
    };
  }

  class Embeddings {
    create(body: EmbeddingCreateParams, options?: any): Promise<CreateEmbeddingResponse>;
  }

  export default class Groq {
    constructor(config: { apiKey: string });
    embeddings: Embeddings;
  }
}