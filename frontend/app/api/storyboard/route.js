import { NextResponse } from "next/server";
import axios from "axios";

const AI_BACKEND = process.env.AI_BACKEND_URL || "http://127.0.0.1:8000";

export async function POST(request) {
  try {
    const { scene } = await request.json();

    const { data } = await axios.post(`${AI_BACKEND}/generate-storyboard`, {
      scene,
    }, {
      timeout: 30000,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Storyboard generation error:", error.message);
    return NextResponse.json(
      { detail: error.message || "Failed to generate storyboard" },
      { status: 500 }
    );
  }
}
