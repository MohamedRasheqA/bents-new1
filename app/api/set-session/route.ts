import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import pool from '@/lib/db';

interface Conversation {
  question: string;
  text: string;
  videoLinks?: Record<string, any>;
  related_products?: any[];
  timestamp: string;
}

interface Session {
  id: string;
  conversations: Conversation[];
}

// Helper function to check if a conversation is empty
function isValidConversation(conv: Conversation): boolean {
  return Boolean(
    conv.question?.trim() || 
    conv.text?.trim() || 
    Object.keys(conv.videoLinks || {}).length > 0 ||
    (conv.related_products || []).length > 0
  );
}

// Helper function to check if a session is empty
function isValidSession(session: Session): boolean {
  const validConversations = session.conversations.filter(isValidConversation);
  return Boolean(session.id && validConversations.length > 0);
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    console.log('SET Session - User ID from header:', userId);

    if (!userId) {
      console.log('SET Session - No user ID found in header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessions } = body;

    console.log('SET Session - Received sessions:', sessions);

    if (!Array.isArray(sessions)) {
      console.log('SET Session - Invalid sessions data format');
      return NextResponse.json(
        { error: 'Invalid sessions data format' }, 
        { status: 400 }
      );
    }

    // Clean and prepare session data, filtering out empty sessions and conversations
    const cleanedSessionData = sessions
      .filter(isValidSession)
      .map((session: Session) => ({
        id: session.id,
        conversations: session.conversations
          .filter(isValidConversation)
          .map((conv: Conversation) => ({
            question: conv.question,
            text: conv.text,
            videoLinks: conv.videoLinks || {},
            related_products: conv.related_products || [],
            timestamp: conv.timestamp || new Date().toISOString()
          }))
      }));

    // If all sessions were empty, return early
    if (cleanedSessionData.length === 0) {
      console.log('SET Session - No valid sessions to save');
      return NextResponse.json({ 
        success: true,
        sessionCount: 0,
        message: 'No valid sessions to save'
      });
    }

    const client = await pool.connect();
    try {
      // Always get the existing row first
      const existingRow = await client.query(
        'SELECT id, session_data FROM session_hist WHERE user_id = $1',
        [userId]
      );

      let result;
      if (existingRow.rows.length > 0) {
        // If row exists, merge the sessions
        const existingSessions = existingRow.rows[0].session_data || [];
        const mergedSessions = [...existingSessions, ...cleanedSessionData];
        
        // Filter out duplicates and ensure each session has valid conversations
        const uniqueSessions = Array.from(
          new Map(
            mergedSessions
              .filter(isValidSession)
              .map(s => [s.id, s])
          ).values()
        );

        // Update existing row with merged sessions
        result = await client.query(
          `UPDATE session_hist 
           SET session_data = $2::jsonb,
               updated_at = CURRENT_TIMESTAMP 
           WHERE user_id = $1
           RETURNING *`,
          [userId, JSON.stringify(uniqueSessions)]
        );
      } else {
        // If no row exists, create new one
        result = await client.query(
          `INSERT INTO session_hist (user_id, session_data) 
           VALUES ($1, $2::jsonb)
           RETURNING *`,
          [userId, JSON.stringify(cleanedSessionData)]
        );
      }

      console.log('SET Session - Updated/Inserted row:', result.rows[0]);

      return NextResponse.json({ 
        success: true,
        sessionCount: cleanedSessionData.length,
        rowId: result.rows[0].id
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('SET Session - Error:', error);
    return NextResponse.json(
      { error: 'Failed to save session data' }, 
      { status: 500 }
    );
  }
}