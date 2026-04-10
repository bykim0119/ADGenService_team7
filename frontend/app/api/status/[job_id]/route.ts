import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://backend-service:8000";

export async function GET(
  _req: NextRequest,
  { params }: { params: { job_id: string } }
) {
  try {
    const response = await fetch(`${BACKEND_URL}/status/${params.job_id}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ status: "error" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}
