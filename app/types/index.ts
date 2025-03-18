// types/index.ts
export interface ChatHistory {
    role: 'user' | 'assistant';
    content: string;
  }
  
  export interface Document {
    id: string;
    text: string;
    title: string;
    url: string;
    chunk_id: string;
    similarity_score: number;
  }
  
  export interface VideoReference {
    urls: string[];
    timestamp: string;
    video_title: string;
    description: string;
  }
  
  export interface Product {
    id: string;
    title: string;
    tags: string[];
    link: string;
  }
  
  export interface ChatResponse {
    response: string;
    raw_response?: string;
    video_links: Record<string, VideoReference>;
    related_products: Product[];
    urls: string[];
    contexts?: string[];
  }
  