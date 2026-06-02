import { NextResponse } from "next/server";
import axios from "axios";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const AI_BACKEND = process.env.AI_BACKEND_URL || "http://127.0.0.1:8000";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || "default_project";

    // 1. Fetch current story bible from backend
    const { data } = await axios.get(`${AI_BACKEND}/story-bible`, {
      params: { project_id: projectId },
      timeout: 10000,
    });

    // 2. Check if it's empty
    const isEmpty =
      !data ||
      ((!data.important_events || data.important_events.length === 0) &&
       (!data.active_story_threads || data.active_story_threads.length === 0) &&
       (!data.character_summaries || Object.keys(data.character_summaries).length === 0) &&
       (!data.relationship_summaries || Object.keys(data.relationship_summaries).length === 0) &&
       !data.world_summary);

    if (isEmpty && projectId !== "default_project") {
      try {
        const client = await clientPromise;
        const db = client.db("imaginai_db");
        
        // Fetch scenes
        const scenes = await db.collection("scenes")
          .find({ project_id: new ObjectId(projectId) })
          .sort({ order: 1, created_at: 1 })
          .toArray();

        if (scenes.length > 0) {
          console.log(`Story Bible for project ${projectId} is empty but has ${scenes.length} scenes. Rebuilding...`);
          // Fetch characters
          const characters = await db.collection("characters")
            .find({ project_id: new ObjectId(projectId) })
            .toArray();

          const mappedChar = characters.map(c => ({
            id: c._id.toString(),
            name: c.name,
            age: c.age,
            gender: c.gender,
            core_traits: c.core_traits || [],
            strengths: c.strengths || [],
            flaws: c.flaws || [],
            fears: c.fears || [],
            goals: c.goals || [],
            values: c.values || []
          }));

          const mappedScenes = scenes.map(s => ({
            title: s.title || "Untitled Scene",
            prompt: s.prompt || "",
            generated_text: s.generated_text || "",
            characterIds: s.characterIds || [],
            emotion_deltas: s.emotion_deltas || {}
          }));

          // Trigger backend rebuild
          const rebuildRes = await axios.post(`${AI_BACKEND}/rebuild-story-bible`, {
            project_id: projectId,
            characters: mappedChar,
            scenes: mappedScenes
          }, { timeout: 30000 });

          if (rebuildRes.data && rebuildRes.data.story_bible) {
            return NextResponse.json(rebuildRes.data.story_bible);
          }
        }
      } catch (dbErr) {
        console.error("Failed to automatically rebuild story bible:", dbErr.message);
      }
    }

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
