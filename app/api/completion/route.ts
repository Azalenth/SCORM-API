import { type NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

// Initialize the connection pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Function to set CORS headers
function setCorsHeaders(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
}

// Middleware wrapper to handle CORS and other functionalities
async function middlewareWrapper(req: NextRequest, res: NextResponse) {
  if (req.method === "OPTIONS") {
    setCorsHeaders(res);
    return new NextResponse(null, { status: 204 });
  }
  setCorsHeaders(res);
}

export async function OPTIONS(req: NextRequest) {
  const res = new NextResponse();
  await middlewareWrapper(req, res);
  return res;
}

export async function POST(req: NextRequest) {
  const res = new NextResponse();
  await middlewareWrapper(req, res);

  try {
    const { learnerId, courseId, completionStatus } = await req.json();

    if (!learnerId || !courseId || !completionStatus) {
      return new NextResponse(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO course_completion (learner_id, course_id, completion_status)
         VALUES ($1, $2, $3)
         ON CONFLICT (learner_id, course_id) 
         DO UPDATE SET 
           completion_status = $3,
           updated_at = CURRENT_TIMESTAMP`,
        [learnerId, courseId, completionStatus]
      );

      return new NextResponse(
        JSON.stringify({
          success: true,
          message: "Completion data stored successfully",
        }),
        {
          status: 200,
          headers: { "Access-Control-Allow-Origin": "*" },
        }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error storing completion data:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to store completion data" }),
      {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
      }
    );
  }
}

export async function GET(req: NextRequest) {
  const res = new NextResponse();
  await middlewareWrapper(req, res);

  try {
    const { searchParams } = new URL(req.url);
    const learnerId = searchParams.get("learnerId");
    const courseId = searchParams.get("courseId");

    if (!learnerId || !courseId) {
      return new NextResponse(
        JSON.stringify({ error: "Missing learnerId or courseId" }),
        {
          status: 400,
          headers: { "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT 
          completion_status,
          updated_at
        FROM course_completion 
        WHERE learner_id = $1 
        AND course_id = $2`,
        [learnerId, courseId]
      );

      if (result.rows.length > 0) {
        return new NextResponse(
          JSON.stringify({
            completionStatus: result.rows[0].completion_status,
            lastUpdated: result.rows[0].updated_at,
          }),
          {
            status: 200,
            headers: { "Access-Control-Allow-Origin": "*" },
          }
        );
      } else {
        return new NextResponse(
          JSON.stringify({ completionStatus: "not_started" }),
          {
            status: 200,
            headers: { "Access-Control-Allow-Origin": "*" },
          }
        );
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error retrieving completion data:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to retrieve completion data" }),
      {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
      }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const res = new NextResponse();
  await middlewareWrapper(req, res);

  try {
    const { learnerId, courseId } = await req.json();

    if (!learnerId || !courseId) {
      return new NextResponse(
        JSON.stringify({ error: "Missing learnerId or courseId" }),
        {
          status: 400,
          headers: { "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        `DELETE FROM course_completion WHERE learner_id = $1 AND course_id = $2`,
        [learnerId, courseId]
      );

      if (result.rowCount && result.rowCount > 0) {
        return new NextResponse(
          JSON.stringify({ success: true, message: "Completion data deleted successfully" }),
          {
            status: 200,
            headers: { "Access-Control-Allow-Origin": "*" },
          }
        );
      } else {
        return new NextResponse(
          JSON.stringify({ error: "No data found to delete" }),
          {
            status: 404,
            headers: { "Access-Control-Allow-Origin": "*" },
          }
        );
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error deleting completion data:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to delete data" }),
      {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
      }
    );
  }
}

