import { NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';

// Use the same database connection configuration
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL!,
  ssl: {
    rejectUnauthorized: false
  }
});

export async function POST(req: Request) {
  try {
    const { name, email, subject, message } = await req.json();

    // Insert the contact form data into the database
    const query = `
      INSERT INTO contacts (name, email, subject, message, submitted_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id
    `;

    const result = await pool.query(query, [name, email, subject, message]);

    return NextResponse.json({ 
      message: 'Thank you for your message. We will get back to you soon.',
      id: result.rows[0].id 
    });

  } catch (error) {
    console.error('Error saving contact form:', error);
    return NextResponse.json(
      { message: 'Failed to submit contact form. Please try again.' },
      { status: 500 }
    );
  }
}
