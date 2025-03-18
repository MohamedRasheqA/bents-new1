// app/api/random/route.ts
import { NextResponse } from 'next/server';
import { Pool, PoolClient } from 'pg';

interface Question {
  id: string;
  question_text: string;
}

// Create pool with specific configuration
const pool = new Pool({
  connectionString: 'postgresql://Data_owner:JsxygNDC15IO@ep-cool-hill-a5k13m05.us-east-2.aws.neon.tech/Data?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

export async function GET() {
  let client: PoolClient | null = null;

  try {
    // Get client from pool
    client = await pool.connect();
    console.log('Database connected successfully');

    // Execute query with timeout
    const queryPromise = client.query<Question>(`
      SELECT id, question_text 
      FROM questions 
      ORDER BY RANDOM() 
      LIMIT 3
    `);

    // Add timeout to query
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout')), 5000);
    });

    const { rows } = await Promise.race([queryPromise, timeoutPromise]) as { rows: Question[] };
    
    console.log('Fetched random questions:', rows);

    if (!rows || rows.length === 0) {
      // Return default questions if none found
      return NextResponse.json([
        { id: '1', question_text: 'What tools do you recommend for a beginner woodworker?' },
        { id: '2', question_text: 'How can I improve my workshop organization?' },
        { id: '3', question_text: 'What safety equipment should I have in my shop?' }
      ]);
    }

    return NextResponse.json(rows);

  } catch (error) {
    console.error('Database error details:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    // Return default questions on error
    return NextResponse.json([
      { id: '1', question_text: 'What tools do you recommend for a beginner woodworker?' },
      { id: '2', question_text: 'How can I improve my workshop organization?' },
      { id: '3', question_text: 'What safety equipment should I have in my shop?' }
    ]);

  } finally {
    if (client) {
      client.release();
      console.log('Database client released');
    }
  }
}

// Add OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Test the database connection on startup
pool.connect()
  .then(client => {
    console.log('Initial database connection test successful');
    client.release();
  })
  .catch(err => {
    console.error('Initial database connection test failed:', err);
  });