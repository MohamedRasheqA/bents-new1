// Required imports
import OpenAI from 'openai';
import { Pool } from 'pg';
import { traceable } from 'langsmith/traceable';
import { wrapOpenAI } from 'langsmith/wrappers';

// Initialize OpenAI client and database pool
const openaiClient = wrapOpenAI(new OpenAI({ apiKey: process.env.OPENAI_API_KEY }));
const pool = new Pool({ connectionString: process.env.POSTGRES_URL! });

// Store for temporary data
let tempStore: {
  context?: string;
  query?: string;
  userInfo?: any;
} = {};

// Types
interface VideoReference {
  description: string;
  timestamp: string;
  urls: string[];
  video_title: string;
}

interface Product {
  id: string;
  link: string;
  tags: string[];
  title: string;
}

const VIDEO_EXTRACTION_PROMPT = `Based on the provided context and question, identify relevant video references.
For each relevant point, you must provide all three pieces in this exact format:
{{timestamp:MM:SS}}{{title:EXACT Video Title}}{{url:EXACT YouTube URL}}{{description:EXACT CONTENT}}

Rules:
1. Only include videos that are directly relevant to the question
2. Each video reference must be on its own line
3. Must include all four pieces (timestamp, title, URL, description) for each reference
4. Only extract videos and timestamps that are explicitly mentioned in the provided context
5. You must use the EXACT timestamp mentioned in the context - DO NOT make up or estimate timestamps
6. Each timestamp must precisely match the timestamp mentioned in the context for that specific content
7. Format must be exact - no spaces between the parts
8. The description must be concise and exactly what content is shown at that timestamp. Don't make it too long.
9. Never default to video start times or guess timestamps
10. Each reference should look like: {{timestamp:05:30}}{{title:Workshop Tour}}{{url:https://youtube.com/...}}{{description:Demonstration of workbench setup}}

Example:
Context: "At 12:45 in Workshop Basics (https://yt.com/abc), Ben shows chisel sharpening. Later at 15:20, he demonstrates using the chisel."
Should output:
{{timestamp:12:45}}{{title:Workshop Basics}}{{url:https://yt.com/abc}}{{description:Demonstration of chisel sharpening technique}}
{{timestamp:15:20}}{{title:Workshop Basics}}{{url:https://yt.com/abc}}{{description:Demonstration of proper chisel usage}}

Important: Make sure to extract the EXACT timestamp where each specific topic or content is discussed. Don't default to video start times.`;

async function processVideoReferences(content: string): Promise<{
  processedAnswer: string;
  videoDict: Record<string, VideoReference>;
}> {
  const videoPattern = /\{\{timestamp:(\d{2}:\d{2})\}\}\{\{title:([^}]+)\}\}\{\{url:([^}]+)\}\}\{\{description:([^}]+)\}\}/g;
  let processedAnswer = content;
  const matches = Array.from(content.matchAll(videoPattern));
  
  const videoDict = Object.fromEntries(
    matches.map((match, i) => {
      const [_, timestamp, title, url, description] = match;
      
      const cleanDescription = description
        .trim()
        .split('.')[0]
        .replace(/^(This video |Here |In this clip |This clip |Shows |Demonstrates )/, '')
        .trim();
      
      const formattedDescription = cleanDescription.charAt(0).toUpperCase() + cleanDescription.slice(1);
      
      return [
        i.toString(),
        {
          urls: [url],
          timestamp: timestamp,
          video_title: title,
          description: formattedDescription
        }
      ];
    })
  );
  
  return {
    processedAnswer,
    videoDict
  };
}

const getRelatedProducts = traceable(async (videoTitles: string[]): Promise<Product[]> => {
  if (!videoTitles.length) return [];

  try {
    const placeholders = videoTitles.map((_, i) => `$${i + 1}`).join(',');
    const query = `
      SELECT DISTINCT ON (id) id, title, tags, link 
      FROM products 
      WHERE ${videoTitles.map((_, i) => `LOWER(tags) LIKE LOWER($${i + 1})`).join(' OR ')}
    `;
    
    const searchTerms = videoTitles.map(title => `%${title}%`);
    const result = await pool.query(query, searchTerms);
    
    return result.rows.map(product => ({
      id: product.id,
      title: product.title,
      tags: product.tags?.split(',') || [],
      link: product.link
    }));
  } catch (error) {
    console.error('Error getting related products:', error);
    return [];
  }
}, {
  name: "Database Product Retrieval"
});

export async function POST(req: Request) {
  try {
    const userId = req.headers.get('x-user-id') || 'anonymous';
    console.log('🔐 [Links] Request from user:', userId);
    
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
            console.log('🧑‍💼 [Links] User Info:', userInfo);
          } else {
            console.error('❌ [Links] Failed to fetch user info:', await userResponse.text());
          }
        }
      } catch (error) {
        console.error('❌ [Links] Error fetching user info:', error);
      }
    }
    
    const body = await req.json();
    
    // Step 1: Receive and store context and query from chat route
    if (body.context && body.query) {
      console.log('\n=== Step 1: Received Data from Chat Route ===');
      console.log('👤 User ID:', userId);
      if (userInfo) {
        console.log('👤 User Info:', userInfo);
      }
      console.log('📝 Query:', body.query);
      console.log('📚 Context:', body.context.substring(0, 200) + '...');
      console.log('⏳ Waiting for answer from frontend...');
      console.log('=== End Step 1 ===\n');
      
      tempStore = {
        context: body.context,
        query: body.query,
        userInfo: userInfo
      };
      return new Response(JSON.stringify({ 
        status: 'waiting_for_answer',
        hasContext: true 
      }));
    }
    
    // Step 2: Process when answer is received from frontend
    if (body.answer && tempStore.context && tempStore.query) {
      console.log('\n=== Step 2: Processing Frontend Answer ===');
      console.log('👤 User ID:', userId);
      console.log('💭 Answer received:', body.answer.substring(0, 200) + '...');
      
      // Instead of returning error, return empty data if parameters are missing
      if (!tempStore.context || !tempStore.query) {
        console.log('ℹ️ Missing stored context or query - returning empty data');
        return new Response(JSON.stringify({ 
          videoReferences: {},
          relatedProducts: [],
          status: 'success'
        }), { 
          headers: { 'Content-Type': 'application/json' }
        });
      }

      console.log('✅ All required data available:');
      console.log('- Stored Query: ✓');
      console.log('- Stored Context: ✓');
      console.log('- Frontend Answer: ✓');
      
      console.log('\n🤖 Starting video processing pipeline...');
      
      // Define the video reference pipeline function here where userInfo is in scope
      const createVideoReferencePipeline = () => {
        return traceable(
          async (context: string, query: string, answer: string, options?: any) => {
            // LLM call to extract video references
            const response = await openaiClient.chat.completions.create({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content: VIDEO_EXTRACTION_PROMPT
                },
                {
                  role: 'user',
                  content: `Context:\n${context}\n\nOriginal Question: ${query}\n\nAI Answer: ${answer}\n\nExtract relevant video references:`
                }
              ],
              temperature: 0.1,
              stream: false
            });
            
            const videoContent = response.choices[0].message.content || '';
            const { videoDict } = await processVideoReferences(videoContent);
            const videoTitles = Object.values(videoDict).map(v => v.video_title);
            const relatedProducts = await getRelatedProducts(videoTitles);
            
            return { videoDict, relatedProducts };
          }, 
          {
            name: `${userInfo?.firstName || ''}-${userInfo?.lastName || ''}-video-reference-pipeline`,
            metadata: { 
              // Metadata defined at creation time
            }
          }
        );
      };
      
      // Create the pipeline with user info in scope
      const videoReferencePipeline = createVideoReferencePipeline();
      
      // Call the pipeline
      const { videoDict, relatedProducts } = await videoReferencePipeline(
        tempStore.context, 
        tempStore.query, 
        body.answer,
        { 
          metadata: { 
            answer: body.answer,
            userId: userId,
            userFirstName: userInfo?.firstName || null,
            userLastName: userInfo?.lastName || null
          } 
        }
      );
      
      console.log('✅ Video references processed:', Object.keys(videoDict).length);
      console.log('✅ Related products found:', relatedProducts.length);
      
      // Clear the temporary store
      tempStore = {};
      console.log('🧹 Temporary store cleared');
      console.log('=== End Step 2: Processing Complete ===\n');
      
      return new Response(JSON.stringify({ 
        videoReferences: videoDict,
        relatedProducts,
        status: 'success'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // If we reach here, it means either:
    // 1. No context/query was provided initially
    // 2. Answer received but no stored context/query
    return new Response(JSON.stringify({ 
      videoReferences: {},
      relatedProducts: [],
      status: 'success',
      hasContext: false
    }));
    
  } catch (error) {
    console.error('❌ Error in links route:', error);
    return new Response(JSON.stringify({ 
      videoReferences: {},
      relatedProducts: [],
      status: 'success',
      hasContext: false
    }));
  }
}