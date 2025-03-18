import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    console.log('GET User - User ID from header:', userId);

    if (!userId) {
      console.log('GET User - No user ID found in header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Clerk API endpoint to retrieve user details
    const clerkApiUrl = `https://api.clerk.com/v1/users/${userId}`;
    
    // Get the Clerk API key from environment variables
    const clerkApiKey = process.env.CLERK_API_KEY;
    
    if (!clerkApiKey) {
      console.error('GET User - CLERK_API_KEY is not defined in environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' }, 
        { status: 500 }
      );
    }

    // Make request to Clerk API
    const response = await fetch(clerkApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${clerkApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('GET User - Clerk API error:', errorData);
      
      if (response.status === 404) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      } else if (response.status === 401) {
        return NextResponse.json({ error: 'Authentication invalid' }, { status: 401 });
      } else {
        return NextResponse.json({ error: 'Request failed' }, { status: response.status });
      }
    }

    const userData = await response.json();
    
    // Extract only the needed user information
    const userInfo = {
      id: userData.id,
      firstName: userData.first_name,
      lastName: userData.last_name
    };

    console.log('GET User - Successfully retrieved user data');
    return NextResponse.json(userInfo);
    
  } catch (error) {
    console.error('GET User - Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve user data' }, 
      { status: 500 }
    );
  }
} 