import { Pool } from 'pg';

const pool = new Pool({
  connectionString: "postgresql://Data_owner:JsxygNDC15IO@ep-cool-hill-a5k13m05.us-east-2.aws.neon.tech/Data?sslmode=require",
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : undefined
});

export default pool;