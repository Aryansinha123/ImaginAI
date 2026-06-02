import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const characterName = searchParams.get("characterName");
  const projectId = searchParams.get("projectId") || "default_project";

  if (!characterName) {
    return NextResponse.json({ detail: "Missing characterName parameter" }, { status: 400 });
  }

  try {
    const backendUrl = process.env.AI_BACKEND_URL || "http://127.0.0.1:8000";
    const { data } = await axios.get(`${backendUrl}/character-arc`, {
      params: { character_name: characterName, project_id: projectId }
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Proxy Character Arc Fetch Error:", error.message);
    // Return mock fallback character arc so frontend doesn't crash on network timeouts
    return NextResponse.json({
      starting_state: "Emotionally guarded",
      current_state: "Emotionally guarded",
      growth_direction: "Becoming emotionally open",
      current_conflict: "Fear of abandonment",
      arc_stage: "beginning",
      arc_progress: 0,
      history: []
    });
  }
}
