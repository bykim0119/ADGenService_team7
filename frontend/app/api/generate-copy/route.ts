import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://backend-service:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const response = await fetch(`${BACKEND_URL}/copy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_input: body.user_input,
        category_key: body.category_key || "food",
        history: body.history || [],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: "Backend failed", detail: errorText },
        { status: response.status }
      );
    }

    return NextResponse.json(await response.json());
  } catch (error: any) {
    console.error("Copy proxy error:", error);
    return NextResponse.json(
      { error: "Failed to connect to backend", message: error.message },
      { status: 500 }
    );
  }
}
