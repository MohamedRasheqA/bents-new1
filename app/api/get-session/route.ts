// app/api/get-session/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    console.log('GET Session - User ID from header:', userId);

    if (!userId) {
      console.log('GET Session - No user ID found in header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user info from Clerk API
    const clerkApiUrl = `https://api.clerk.com/v1/users/${userId}`;
    const clerkApiKey = process.env.CLERK_SECRET_KEY;
    
    if (!clerkApiKey) {
      console.error('GET Session - CLERK_API_KEY is not defined in environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' }, 
        { status: 500 }
      );
    }

    // Make request to Clerk API
    const userResponse = await fetch(clerkApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${clerkApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    let userInfo = null;
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
      console.log('GET Session - User Info:', userInfo);
    } else {
      console.error('GET Session - Failed to fetch user info:', await userResponse.text());
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT session_data::json FROM session_hist WHERE user_id = $1',
        [userId]
      );

      console.log('GET Session - Query executed');

      if (result.rows.length > 0 && result.rows[0].session_data) {
        console.log('GET Session - Data found for user');
        return NextResponse.json(result.rows[0].session_data);
      }

      console.log('GET Session - No data found, returning empty array with user info');
      return NextResponse.json({
        sessionData: [],
        userInfo: userInfo
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('GET Session - Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session data' }, 
      { status: 500 }
    );
  }
}