// app/api/products/route.ts
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

interface Product {
  id: string;
  title: string;
  tags: string;
  link: string;
  image_link?: string;
}

// Create pool outside the handler
const pool = new Pool({
  connectionString: "postgresql://Data_owner:JsxygNDC15IO@ep-cool-hill-a5k13m05.us-east-2.aws.neon.tech/Data?sslmode=require",
  ssl: {
    rejectUnauthorized: false
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
  maxUses: 7500 // Close a connection after it has been used 7500 times
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sortOption = searchParams.get('sort') || 'default';
    
    // Modified query to exclude image_data
    let query = 'SELECT id, title, tags, link, image_link FROM products';
    if (sortOption === 'video') {
      query += ' ORDER BY tags';
    }
    
    // Execute query with error logging
    console.log('Executing query:', query);
    const { rows } = await pool.query<Product>(query);
    console.log('Products fetched:', rows.length);
    
    // Process products the same way as your Express version
    const products = rows.map(product => {
      const allTags = product.tags.split(',').map(tag => tag.trim());
      return {
        ...product,
        tags: allTags,
        groupTags: allTags.slice(0, -1)
      };
    });

    // Match the exact response format from your Express version
    if (sortOption === 'video') {
      const groupedProducts: { [key: string]: typeof products } = {};
      products.forEach(product => {
        product.groupTags.forEach(tag => {
          if (!groupedProducts[tag]) {
            groupedProducts[tag] = [];
          }
          groupedProducts[tag].push(product);
        });
      });
      
      return NextResponse.json({ groupedProducts, sortOption });
    }

    return NextResponse.json({ products, sortOption });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}