// lib/openai.ts
import OpenAI from 'openai';
import { ChatHistory } from '@/app/types';

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async createEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    return response.data[0].embedding;
  }

  async checkRelevance(query: string, chatHistory: ChatHistory[]): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Categorize messages as: GREETING, RELEVANT, INAPPROPRIATE, or NOT RELEVANT"
        },
        {
          role: "user",
          content: `Question: ${query}\nHistory: ${JSON.stringify(chatHistory)}`
        }
      ]
    });
    return response.choices[0].message.content || "NOT RELEVANT";
  }

  async generateResponse(context: string, query: string, systemInstructions: string) {
    return await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemInstructions },
        { role: "user", content: `Context: ${context}\nQuestion: ${query}` }
      ]
    });
  }
}