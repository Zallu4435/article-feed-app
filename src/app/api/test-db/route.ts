import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

export const runtime = "nodejs";

const createPool = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  return new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : { rejectUnauthorized: false },
    max: Number(process.env.DB_POOL_MAX || 3),
    connectionTimeoutMillis: Number(process.env.DB_POOL_TIMEOUT || 10000),
    idleTimeoutMillis: 10000,
  });
};

export async function GET(request: NextRequest) {
  let pool: Pool | null = null;
  try {
    pool = createPool();
    const client = await pool.connect();
    const res = await client.query("SELECT NOW() as now, version() as version");
    client.release();

    return NextResponse.json({
      success: true,
      message: "Database connection is healthy",
      data: {
        now: res.rows[0].now,
        version: res.rows[0].version,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Failed to test database connection",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  } finally {
    if (pool) await pool.end().catch(() => {});
  }
}

export async function POST(request: NextRequest) {
  let pool: Pool | null = null;
  try {
    const body = await request.json().catch(() => ({}));
    const action = body?.action;

    pool = createPool();
    const client = await pool.connect();

    if (action === "ping") {
      const res = await client.query("SELECT NOW() as now, current_database() as db, current_schema() as schema");
      client.release();
      return NextResponse.json({
        success: true,
        action: "ping",
        data: res.rows[0],
        timestamp: new Date().toISOString(),
      });
    }

    // default to health
    const res = await client.query("SELECT 1 as ok");
    client.release();
    return NextResponse.json({
      success: true,
      action: "health",
      data: res.rows[0],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Failed to perform database test action",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  } finally {
    if (pool) await pool.end().catch(() => {});
  }
}
