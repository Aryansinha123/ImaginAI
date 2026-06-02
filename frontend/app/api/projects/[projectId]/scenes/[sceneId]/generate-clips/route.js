import clientPromise from "@/lib/mongodb";
import { getUserIdFromRequest } from "@/lib/auth";
import { ObjectId } from "mongodb";
import axios from "axios";

export async function POST(req, { params }) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return Response.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { projectId, sceneId } = await params;

  try {
    const client = await clientPromise;
    const db = client.db("imaginai_db");

    // Verify project belongs to user
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId),
      user_id: new ObjectId(userId)
    });

    if (!project) {
      return Response.json({ detail: "Project not found" }, { status: 404 });
    }

    // Get the scene
    const scene = await db.collection("scenes").findOne({
      _id: new ObjectId(sceneId),
      project_id: new ObjectId(projectId)
    });

    if (!scene) {
      return Response.json({ detail: "Scene not found" }, { status: 404 });
    }

    if (!scene.generated_text) {
      return Response.json({ detail: "Scene has no generated text to visualize" }, { status: 400 });
    }

    // Resolve characters from the scene's characterIds
    let characters = [];
    if (scene.characterIds && scene.characterIds.length > 0) {
      const charOids = scene.characterIds.map(id => new ObjectId(id));
      characters = await db.collection("characters")
        .find({ _id: { $in: charOids } })
        .toArray();
    }

    // Call the Python backend to generate video clips
    const backendUrl = process.env.AI_BACKEND_URL || "http://127.0.0.1:8000";
    const apiRes = await axios.post(`${backendUrl}/generate-scene-clips`, {
      scene_text: scene.generated_text,
      direction: scene.direction || null,
      characters: characters.map(c => ({
        name: c.name,
        age: c.age,
        gender: c.gender,
        core_traits: c.core_traits,
      })),
      num_frames: 3,
    });

    const clipFilenames = apiRes.data.clips || [];

    // Update the scene in the database with the new clips
    const updated = await db.collection("scenes").findOneAndUpdate(
      { _id: new ObjectId(sceneId), project_id: new ObjectId(projectId) },
      { $set: { clips: clipFilenames } },
      { returnDocument: "after" }
    );

    return Response.json({
      id: updated._id.toString(),
      projectId: updated.project_id.toString(),
      user_id: updated.user_id.toString(),
      title: updated.title,
      prompt: updated.prompt,
      generated_text: updated.generated_text,
      tone: updated.tone,
      characterIds: updated.characterIds || [],
      order: updated.order !== undefined ? updated.order : 0,
      created_at: updated.created_at,
      direction: updated.direction || null,
      emotion_deltas: updated.emotion_deltas || {},
      images: updated.images || [],
      image: updated.image || null,
      clips: updated.clips || [],
      hidden_thoughts: updated.hidden_thoughts || {},
      parent_id: updated.parent_id || null,
      branch_id: updated.branch_id || "main",
      decision: updated.decision || null
    });
  } catch (error) {
    console.error("Generate Scene Clips Error:", error);
    const detail = error.response?.data?.detail || "Server error";
    return Response.json({ detail }, { status: 500 });
  }
}
