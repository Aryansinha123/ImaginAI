import { NextResponse } from "next/server";
import axios from "axios";

const AI_BACKEND = process.env.AI_BACKEND_URL || "http://127.0.0.1:8000";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || "default_project";

    const { data } = await axios.get(`${AI_BACKEND}/story-bible`, {
      params: { project_id: projectId },
      timeout: 10000,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Story bible fetch error:", error.message);
    return NextResponse.json(
      {
        important_events: [],
        active_story_threads: [],
        character_summaries: {},
        relationship_summaries: {},
        world_summary: "",
      },
      { status: 200 }
    );
  }
}
