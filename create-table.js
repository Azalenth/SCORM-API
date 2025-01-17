const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
});

async function createTable() {
  try {
    const client = await pool.connect();
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS course_completion (
        learner_id VARCHAR(255),
        course_id VARCHAR(255),
        completion_status VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (learner_id, course_id)
      );
    `;

    await client.query(createTableQuery);
    console.log('Table created successfully');
    
    client.release();
  } catch (err) {
    console.error('Error creating table:', err);
  } finally {
    await pool.end();
  }
}

createTable();

