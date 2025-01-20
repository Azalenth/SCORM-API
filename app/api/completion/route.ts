import { type NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import Cors from "cors";
import type { IncomingMessage, ServerResponse } from "http";

// Initialize the connection pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Initializing the cors middleware
const cors = Cors({
  methods: ["GET", "POST", "OPTIONS"],
  origin: "*", // Be cautious with this in production
  allowedHeaders: ["Content-Type"],
  optionsSuccessStatus: 200,
});

// Define a specific type for the middleware function
type MiddlewareFunction = (req: IncomingMessage, res: ServerResponse, next: (result?: unknown) => void) => void;

// Helper method to run middleware
function runMiddleware(req: IncomingMessage, res: ServerResponse, fn: MiddlewareFunction) {
  return new Promise<void>((resolve, reject) => {
    fn(req, res, (result: unknown) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve();
    });
  });
}

// Middleware wrapper to adapt Next.js request/response to Node.js
async function middlewareWrapper(req: NextRequest, res: NextResponse, fn: MiddlewareFunction) {
  // Create a mock request object compatible with the cors middleware
  const reqAdapted = {
    headers: Object.fromEntries(req.headers.entries()),
    method: req.method ?? "GET",
    url: req.url,
  } as unknown as IncomingMessage;

  // Create a mock response object compatible with the cors middleware
  const resAdapted = {
    setHeader: (key: string, value: string) => res.headers.set(key, value),
    end: () => {},
  } as unknown as ServerResponse;

  await runMiddleware(reqAdapted, resAdapted, fn);
}

export async function OPTIONS(req: NextRequest) {
  const res = new NextResponse();
  await middlewareWrapper(req, res, cors);
  return new NextResponse(null, {
    status: 204, // No Content
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(req: NextRequest) {
  const res = new NextResponse();
  await middlewareWrapper(req, res, cors);

  try {
    const { learnerId, courseId, completionStatus } = await req.json();

    if (!learnerId || !courseId || !completionStatus) {
      return NextResponse.json(
        { error: "Missing required fields" },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
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
        }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error storing completion data:", error);
    return NextResponse.json(
      { error: "Failed to store completion data" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}

export async function GET(req: NextRequest) {
  const res = new NextResponse();
  await middlewareWrapper(req, res, cors);

  try {
    const { searchParams } = new URL(req.url);
    const learnerId = searchParams.get("learnerId");
    const courseId = searchParams.get("courseId");

    if (!learnerId || !courseId) {
      return NextResponse.json(
        { error: "Missing learnerId or courseId" },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
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
        console.log("Completion data found:", {
          learnerId,
          courseId,
          completionStatus: result.rows[0].completion_status,
          lastUpdated: result.rows[0].updated_at,
        });
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
          }
        );
      } else {
        console.log("No completion data found for:", { learnerId, courseId });
        return NextResponse.json(
          { completionStatus: "not_started" },
          {
            status: 200,
            headers: {
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error retrieving completion data:", error);
    return NextResponse.json(
      { error: "Failed to retrieve completion data" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}