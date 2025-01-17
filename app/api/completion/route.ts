import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
})

// Handle POST requests to store completion data
export async function POST(request: Request) {
  try {
    const { learnerId, courseId, completionStatus } = await request.json()

    // Validate required fields
    if (!learnerId || !courseId || !completionStatus) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Store completion data
    const client = await pool.connect()
    try {
      await client.query(
        `INSERT INTO course_completion (learner_id, course_id, completion_status)
         VALUES ($1, $2, $3)
         ON CONFLICT (learner_id, course_id) 
         DO UPDATE SET 
           completion_status = $3,
           updated_at = CURRENT_TIMESTAMP`,
        [learnerId, courseId, completionStatus]
      )

      return NextResponse.json({
        success: true,
        message: 'Completion data stored successfully'
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error storing completion data:', error)
    return NextResponse.json(
      { error: 'Failed to store completion data' },
      { status: 500 }
    )
  }
}

// Handle GET requests to retrieve completion data
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const learnerId = searchParams.get('learnerId')
    const courseId = searchParams.get('courseId')

    // Validate required parameters
    if (!learnerId || !courseId) {
      return NextResponse.json(
        { error: 'Missing learnerId or courseId' },
        { status: 400 }
      )
    }

    // Retrieve completion data
    const client = await pool.connect()
    try {
      const result = await client.query(
        `SELECT 
          completion_status,
          updated_at
        FROM course_completion 
        WHERE learner_id = $1 
        AND course_id = $2`,
        [learnerId, courseId]
      )

      if (result.rows.length > 0) {
        return NextResponse.json({
          completionStatus: result.rows[0].completion_status,
          lastUpdated: result.rows[0].updated_at
        })
      } else {
        return NextResponse.json({ completionStatus: 'not_started' })
      }
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error retrieving completion data:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve completion data' },
      { status: 500 }
    )
  }
}

