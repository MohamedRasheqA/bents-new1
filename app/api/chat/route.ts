import { openai } from '@ai-sdk/openai';
import { streamText, embed } from 'ai';
import { neonConfig, Pool } from '@neondatabase/serverless';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import OpenAI from 'openai';
import { traceable } from 'langsmith/traceable';
import { AISDKExporter } from 'langsmith/vercel';
import { wrapOpenAI } from 'langsmith/wrappers';
// Types
interface ChatHistory {
  role: 'user' | 'assistant';
  content: string;
}

interface Document {
  id: string;
  text: string;
  title: string;
  url: string;
  chunk_id: string;
  similarity_score: number;
}

// Utility functions
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Initialize DB service
class DatabaseService {
  private client: Pool;
  constructor() {
    this.client = new Pool({ 
      connectionString: process.env.POSTGRES_URL!,
      connectionTimeoutMillis: 10000, // 10 seconds timeout
      max: 20, // Maximum number of clients
      idleTimeoutMillis: 30000 // How long a client is allowed to remain idle
    });
  }

  async searchNeonDb(queryEmbedding: number[], tableName: string, topK: number = 10): Promise<Document[]> {
    console.log('📊 [DB Search] Function called with:', {
      tableName,
      topK,
      embeddingLength: queryEmbedding.length
    });
    
    const embeddingStr = `[${queryEmbedding.join(',')}]`;
    const query = `
      SELECT id, text, title, url, chunk_id,
             1 - (vector <=> $1::vector) as similarity_score
      FROM ${tableName}
      WHERE vector IS NOT NULL
      ORDER BY vector <=> $1::vector
      LIMIT $2;
    `;
    
    try {
      const result = await this.client.query(query, [embeddingStr, topK]);
      console.log('✅ [DB Search] Successfully found documents:', {
        count: result.rows.length,
        table: tableName
      });
      return result.rows.map(row => ({
        id: row.id,
        text: row.text,
        title: row.title,
        url: row.url,
        chunk_id: row.chunk_id,
        similarity_score: parseFloat(row.similarity_score)
      }));
    } catch (error) {
      console.error('❌ [DB Search] Error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        table: tableName
      });
      throw error;
    }
  }
}

const dbService = new DatabaseService();

// Initialize OpenAI client
const openaiClient = wrapOpenAI(new OpenAI({ apiKey: process.env.OPENAI_API_KEY }));

// Add these functions before the POST handler
type RelevanceResult = 'GREETING' | 'RELEVANT' | 'INAPPROPRIATE' | 'NOT_RELEVANT';

async function checkRelevance(query: string, chatHistory: ChatHistory[]) {
  console.log('🔍 [Relevance Check] Function called:', {
    query,
    historyLength: chatHistory.length
  });
  const relevancePrompt = `Given this question and chat history, determine if it is:
1. A greeting/send-off (GREETING)
2. Related to woodworking/tools/company (RELEVANT)
3. Inappropriate content (INAPPROPRIATE)
4. Unrelated (NOT_RELEVANT)

Chat History: ${JSON.stringify(chatHistory.slice(-5))}
Current Question: ${query}

Response (GREETING, RELEVANT, INAPPROPRIATE, or NOT_RELEVANT):`;

  const result = await openaiClient.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: relevancePrompt }],
    temperature: 0
  });
  console.log('🔍 [Relevance Check] Result:', {
    query,
    result: result.choices[0].message.content
  });
  return result.choices[0].message.content?.trim().toUpperCase() || 'NOT_RELEVANT';
}

async function rewriteQuery(query: string, chatHistory: ChatHistory[] = []) {
  console.log('✍️ [Query Rewrite] Function called:', {
    query,
    historyLength: chatHistory.length
  });
  const rewritePrompt = `You are bent's woodworks assistant so question will be related to wood shop. 
Rewrites user query to make them more specific and searchable, taking into account 
the chat history if provided. Only return the rewritten query without any explanations.

Original query: ${query}
Chat history: ${JSON.stringify(chatHistory)}

Rewritten query:`;

  try {
    const result = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: rewritePrompt }],
      temperature: 0
    });
    const cleanedResponse = result.choices[0].message.content?.replace("Rewritten query:", "").trim();
    return cleanedResponse || query;
  } catch (error) {
    return query;
  }
}

// Updated System Instructions
const SYSTEM_INSTRUCTIONS = `You are an AI assistant representing Jason Bent's woodworking expertise. Your role is to:
1. Analyze woodworking documents and provide clear, natural responses that sound like Jason Bent is explaining the concepts.
2. Convert technical content into conversational, easy-to-understand explanations.
3. Focus on explaining the core concepts and techniques rather than quoting directly from transcripts.
4. Always maintain a friendly, professional tone as if Jason Bent is speaking directly to the user.
5. Organize multi-part responses clearly with natural transitions.
6. Keep responses concise and focused on the specific question asked.
7. If information isn't available in the provided context, clearly state that.
8. Always respond in English, regardless of the input language.
9. Avoid using phrases like "in the video" or "the transcript shows" - instead, speak directly about the techniques and concepts.

Response Structure and Formatting:
   - Use markdown formatting with clear hierarchical structure
   - Each major section must start with '### ' followed by a number and bold title
   - Format section headers as: ### 1. **Title Here**
   - Use bullet points (-) for detailed explanations under each section
   - Each bullet point must contain 2-3 sentences minimum with examples
   - Add blank lines between major sections only
   - Indent bullet points with proper spacing
   - Do NOT use bold formatting (**) or line breaks within bullet point content
   - Bold formatting should ONLY be used in section headers
   - Keep all content within a bullet point on the same line
   - Any asterisks (*) in the content should be treated as literal characters, not formatting



Remember:
- You are speaking as Jason Bent's AI assistant and so if you are mentioning jason bent, you should use the word "Jason Bent" instead of "I" like "Jason Bent will suggest that you..."
- Focus on analyzing the transcripts and explaining the concepts naturally rather than quoting transcripts
- Keep responses clear, practical, and focused on woodworking expertise
`;

export const runtime = 'edge';
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const userId = req.headers.get('x-user-id') || 'anonymous';
    console.log('🔐 [Chat] Request from user:', userId);
    
    // Fetch user info from Clerk API
    let userInfo = null;
    if (userId && userId !== 'anonymous') {
      try {
        const clerkApiUrl = `https://api.clerk.com/v1/users/${userId}`;
        const clerkApiKey = process.env.CLERK_SECRET_KEY;
        
        if (clerkApiKey) {
          const userResponse = await fetch(clerkApiUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${clerkApiKey}`,
              'Content-Type': 'application/json'
            }
          });

          if (userResponse.ok) {
            const userData = await userResponse.json();
            userInfo = {
              id: userData.id,
              firstName: userData.first_name,
              lastName: userData.last_name,
              email: userData.primary_email_address_id ? 
                userData.email_addresses.find((email: any) => email.id === userData.primary_email_address_id)?.email_address : 
                null
            };
            console.log('🧑‍💼 [Chat] User Info:', userInfo);
          } else {
            console.error('❌ [Chat] Failed to fetch user info:', await userResponse.text());
          }
        }
      } catch (error) {
        console.error('❌ [Chat] Error fetching user info:', error);
      }
    }
    
    // Convert userInfo to a format compatible with LangSmith
    const langsmithUserInfo = userInfo ? {
      id: userInfo.id,
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      email: userInfo.email || null
    } : null;

    const pipeline = traceable(async (messages: any[], lastUserMessage: string, clerkUserId: string, userInfo: any = null) => {
      // Existing relevance check and query rewrite logic remains
      const relevanceResult = await checkRelevance(lastUserMessage, messages);
      
      if (relevanceResult === 'GREETING' || relevanceResult === 'INAPPROPRIATE' || relevanceResult === 'NOT_RELEVANT') {
        if (relevanceResult === 'GREETING') {
          return streamText({
            model: openai('gpt-4o-mini'),
            messages: [{ 
              role: 'user', 
              content: `The following message is a greeting or casual message. Please provide a friendly and engaging response: ${lastUserMessage}` 
            }],
            experimental_telemetry: AISDKExporter.getSettings({
              runName: 'greeting-completion',
              metadata: { 
                type: 'greeting', 
                userId: clerkUserId,
                ...(userInfo ? {
                  userFirstName: userInfo.firstName,
                  userLastName: userInfo.lastName,
                  userEmail: userInfo.email || null
                } : {})
              }
            })
          });
        }
        if (relevanceResult === 'INAPPROPRIATE') {
          return streamText({
            model: openai('gpt-4o-mini'),
            messages: [{ 
              role: 'user',
              content: `Please respond with the following message: "I apologize, but I cannot assist with inappropriate content or queries that could cause harm. I'm here to help with woodworking and furniture making questions only."`
            }],
            experimental_telemetry: AISDKExporter.getSettings({
              runName: 'inappropriate-completion',
              metadata: { 
                type: 'inappropriate', 
                userId: clerkUserId,
                ...(userInfo ? {
                  userFirstName: userInfo.firstName,
                  userLastName: userInfo.lastName,
                  userEmail: userInfo.email || null
                } : {})
              }
            })
          });
        }
        if (relevanceResult === 'NOT_RELEVANT') {
          return streamText({
            model: openai('gpt-4o-mini'),
            messages: [
              {
                role: 'user',
                content: `The following question is not directly related to woodworking or the assistant's expertise. Provide a direct response that:
                1. Politely acknowledges the question
                2. Explains that you are specialized in woodworking and Jason Bent's content
                3. Asks them to rephrase their question to relate to woodworking topics
                Question: ${lastUserMessage}`
              }
            ],
            experimental_telemetry: AISDKExporter.getSettings({
              runName: 'not-relevant-completion',
              metadata: { 
                type: 'not-relevant', 
                userId: clerkUserId,
                ...(userInfo ? {
                  userFirstName: userInfo.firstName,
                  userLastName: userInfo.lastName,
                  userEmail: userInfo.email || null
                } : {})
              }
            })
          });
        }
      }

      // For RELEVANT messages, continue with existing logic
      const rewrittenQuery = await rewriteQuery(lastUserMessage, messages);
      
      // Continue with existing embedding logic using rewrittenQuery
      console.log('⏳ [POST] Generating embedding');
      const { embedding } = await embed({
        model: openai.embedding('text-embedding-ada-002'),
        value: rewrittenQuery,
        maxRetries: 2,
        abortSignal: AbortSignal.timeout(5000)
      });
      console.log('✅ [POST] Embedding generated:', {
        length: embedding.length
      });
      
      // Before DB search
      console.log('⏳ [POST] Searching database');
      const similarDocs = await dbService.searchNeonDb(embedding, "bents", 10);
      console.log('✅ [POST] Found similar documents:', {
        count: similarDocs.length
      });

      const contextTexts = similarDocs.map(doc => 
        `Source: ${doc.title}\nContent: ${doc.text}\nURL: ${doc.url}`
      ).join('\n\n');

      // Only make links request for RELEVANT messages that have context
      if (relevanceResult === 'RELEVANT' && contextTexts) {
        console.log('📤 [Chat] Sending data to links route:', {
          messagesCount: messages.length,
          contextLength: contextTexts.length,
          rewrittenQuery
        });

        const linksResponse = await fetch(new URL('/api/links', req.url), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': clerkUserId
          },
          body: JSON.stringify({
            context: contextTexts,
            query: rewrittenQuery
          })
        });

        const linksData = await linksResponse.json();
        console.log('📥 [Chat] Received response from links route:', {
          status: linksResponse.status,
          hasVideoRefs: Boolean(linksData?.videoReferences),
          hasProducts: Boolean(linksData?.relatedProducts)
        });
      }

      // For RELEVANT cases, add experimental_telemetry with user info
      console.log('⏳ [POST] Streaming response');
      return streamText({
        model: openai('gpt-4o-mini'),
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTIONS },
          { 
            role: "user", 
            content: `Chat History:\n${JSON.stringify(messages.slice(-5))}\n\nContext:\n${contextTexts}\n\nQuestion: ${lastUserMessage}` 
          }
        ],
        experimental_telemetry: AISDKExporter.getSettings({
          runName: 'relevant-completion',
          metadata: { 
            type: 'relevant', 
            userId: clerkUserId,
            ...(userInfo ? {
              userFirstName: userInfo.firstName,
              userLastName: userInfo.lastName,
              userEmail: userInfo.email || null
            } : {})
          }
        })
      });
    }, {
      name: `${userInfo?.firstName || ''}-${userInfo?.lastName || ''}-chat-pipeline`,
      metadata: { 
        userId,
        ...(userInfo ? {
          userFirstName: userInfo.firstName,
          userLastName: userInfo.lastName,
          userEmail: userInfo.email || null
        } : {})
      }
    });

    const body = await req.json();
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const lastUserMessage = messages.findLast(
      (msg: { role: string; content: string }) => msg.role === 'user'
    )?.content || '';

    const response = await pipeline(messages, lastUserMessage, userId, userInfo);
    return response.toDataStreamResponse();

  } catch (error) {
    console.error('API route error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}