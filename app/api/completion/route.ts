import { NextResponse } from "next/server"
import { Pool } from "pg"
import Cors from "cors"

// Initialize the connection pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
  },
})

// Initializing the cors middleware
const cors = Cors({
  methods: ["GET", "POST", "OPTIONS"],
  origin: "*", // Be cautious with this in production
  optionsSuccessStatus: 200,
})

// Helper method to run middleware
function runMiddleware(req: any, res: any, fn: Function) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result)
      }
      return resolve(result)
    })
  })
}

export async function OPTIONS(req: Request) {
  console.log("OPTIONS request received")
  const res = new NextResponse()
  await runMiddleware(req, res, cors)
  console.log("CORS middleware applied for OPTIONS")
  return new NextResponse(null, { status: 200 })
}

export async function POST(req: Request) {
  console.log("POST request received")
  const res = new NextResponse()
  await runMiddleware(req, res, cors)
  console.log("CORS middleware applied for POST")

  try {
    const { learnerId, courseId, completionStatus } = await req.json()
    console.log("Received data:", { learnerId, courseId, completionStatus })

    if (!learnerId || !courseId || !completionStatus) {
      console.log("Missing required fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const client = await pool.connect()
    console.log("Database connection established")
    try {
      await client.query(
        `INSERT INTO course_completion (learner_id, course_id, completion_status)
         VALUES ($1, $2, $3)
         ON CONFLICT (learner_id, course_id) 
         DO UPDATE SET 
           completion_status = $3,
           updated_at = CURRENT_TIMESTAMP`,
        [learnerId, courseId, completionStatus],
      )
      console.log("Database query executed successfully")

      return NextResponse.json({
        success: true,
        message: "Completion data stored successfully",
      })
    } finally {
      client.release()
      console.log("Database connection released")
    }
  } catch (error) {
    console.error("Error storing completion data:", error)
    return NextResponse.json({ error: "Failed to store completion data" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  console.log("GET request received")
  const res = new NextResponse()
  await runMiddleware(req, res, cors)
  console.log("CORS middleware applied for GET")

  try {
    const { searchParams } = new URL(req.url)
    const learnerId = searchParams.get("learnerId")
    const courseId = searchParams.get("courseId")
    console.log("Received parameters:", { learnerId, courseId })

    if (!learnerId || !courseId) {
      console.log("Missing learnerId or courseId")
      return NextResponse.json({ error: "Missing learnerId or courseId" }, { status: 400 })
    }

    const client = await pool.connect()
    console.log("Database connection established")
    try {
      const result = await client.query(
        `SELECT 
          completion_status,
          updated_at
        FROM course_completion 
        WHERE learner_id = $1 
        AND course_id = $2`,
        [learnerId, courseId],
      )
      console.log("Database query executed successfully")

      if (result.rows.length > 0) {
        console.log("Completion data found:", result.rows[0])
        return NextResponse.json({
          completionStatus: result.rows[0].completion_status,
          lastUpdated: result.rows[0].updated_at,
        })
      } else {
        console.log("No completion data found")
        return NextResponse.json({ completionStatus: "not_started" })
      }
    } finally {
      client.release()
      console.log("Database connection released")
    }
  } catch (error) {
    console.error("Error retrieving completion data:", error)
    return NextResponse.json({ error: "Failed to retrieve completion data" }, { status: 500 })
  }
}

