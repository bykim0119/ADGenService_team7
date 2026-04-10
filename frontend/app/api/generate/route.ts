import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://backend-service:8000";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const response = await fetch(`${BACKEND_URL}/generate`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: "Backend failed", detail: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    // { job_id: string }
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Generate proxy error:", error);
    return NextResponse.json(
      { error: "Failed to connect to backend", message: error.message },
      { status: 500 }
    );
  }
}
