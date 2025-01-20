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
  const res = new NextResponse()
  await runMiddleware(req, res, cors)
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}

export async function POST(req: Request) {
  const res = new NextResponse()
  await runMiddleware(req, res, cors)

  try {
    const { learnerId, courseId, completionStatus } = await req.json()

    if (!learnerId || !courseId || !completionStatus) {
      return NextResponse.json(
        { error: "Missing required fields" },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        },
      )
    }

    const client = await pool.connect()
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

      return NextResponse.json(
        {
          success: true,
          message: "Completion data stored successfully",
        },
        {
          status: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        },
      )
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error storing completion data:", error)
    return NextResponse.json(
      { error: "Failed to store completion data" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      },
    )
  }
}

export async function GET(req: Request) {
  const res = new NextResponse()
  await runMiddleware(req, res, cors)

  try {
    const { searchParams } = new URL(req.url)
    const learnerId = searchParams.get("learnerId")
    const courseId = searchParams.get("courseId")

    if (!learnerId || !courseId) {
      return NextResponse.json(
        { error: "Missing learnerId or courseId" },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        },
      )
    }

    const client = await pool.connect()
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

      if (result.rows.length > 0) {
        console.log("Completion data found:", {
          learnerId,
          courseId,
          completionStatus: result.rows[0].completion_status,
          lastUpdated: result.rows[0].updated_at,
        })
        return NextResponse.json(
          {
            completionStatus: result.rows[0].completion_status,
            lastUpdated: result.rows[0].updated_at,
          },
          {
            status: 200,
            headers: {
              "Access-Control-Allow-Origin": "*",
            },
          },
        )
      } else {
        console.log("No completion data found for:", { learnerId, courseId })
        return NextResponse.json(
          { completionStatus: "not_started" },
          {
            status: 200,
            headers: {
              "Access-Control-Allow-Origin": "*",
            },
          },
        )
      }
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error retrieving completion data:", error)
    return NextResponse.json(
      { error: "Failed to retrieve completion data" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      },
    )
  }
}

