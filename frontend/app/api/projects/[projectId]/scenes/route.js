import clientPromise from "@/lib/mongodb";
import { getUserIdFromRequest } from "@/lib/auth";
import { ObjectId } from "mongodb";
import axios from "axios";

export async function GET(req, { params }) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return Response.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  try {
    const client = await clientPromise;
    const db = client.db("imaginai_db");

    // Verify project exists and belongs to user
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId),
      user_id: new ObjectId(userId)
    });

    if (!project) {
      return Response.json({ detail: "Project not found" }, { status: 404 });
    }

    const scenes = await db
      .collection("scenes")
      .find({ project_id: new ObjectId(projectId) })
      .sort({ order: 1, created_at: 1 })
      .toArray();

    const mapped = scenes.map(s => ({
      id: s._id.toString(),
      projectId: s.project_id.toString(),
      user_id: s.user_id.toString(),
      title: s.title || "Untitled Scene",
      prompt: s.prompt,
      generated_text: s.generated_text,
      tone: s.tone || "neutral",
      characterIds: s.characterIds || [],
      order: s.order !== undefined ? s.order : 0,
      created_at: s.created_at
    }));

    return Response.json(mapped);
  } catch (error) {
    console.error("Fetch Scenes Error:", error);
    return Response.json({ detail: "Server error" }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return Response.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  try {
    const { scene, characterIds, character, title, tone, generated_text } = await req.json();
    if (!scene) {
      return Response.json({ detail: "Missing scene prompt" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("imaginai_db");

    // Verify project exists and belongs to user
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId),
      user_id: new ObjectId(userId)
    });

    if (!project) {
      return Response.json({ detail: "Project not found" }, { status: 404 });
    }

    // Resolve multiple characters details from DB
    let assignedCharacters = [];
    const resolvedIds = (characterIds || []).map(id => new ObjectId(id));
    if (resolvedIds.length > 0) {
      assignedCharacters = await db.collection("characters")
        .find({ _id: { $in: resolvedIds } })
        .toArray();
    } else if (character) {
      assignedCharacters = [character];
    }

    // Fetch last 3 scenes as past memories for cinematic continuity
    const pastScenes = await db.collection("scenes")
      .find({ project_id: new ObjectId(projectId) })
      .sort({ order: 1, created_at: 1 })
      .limit(3)
      .toArray();

    const past_memories = pastScenes.length > 0 
      ? pastScenes.map(s => `Scene Title: ${s.title || "Untitled"}\nScene Prompt: ${s.prompt}\nEnhanced Story: ${s.generated_text}`).join("\n\n")
      : "No previous events recorded.";

    let generatedText = generated_text;
    if (!generatedText) {
      // Call stateless FastAPI completions backend
      const apiRes = await axios.post("http://127.0.0.1:8000/generate-scene", {
        scene,
        characters: assignedCharacters,
        tone: tone || "neutral",
        past_memories
      });
      generatedText = apiRes.data.scene;
    }
    const sceneCount = await db.collection("scenes").countDocuments({ project_id: new ObjectId(projectId) });

    const newScene = {
      project_id: new ObjectId(projectId),
      user_id: new ObjectId(userId),
      title: title?.trim() || "Untitled Scene",
      prompt: scene,
      generated_text: generatedText,
      tone: tone || "neutral",
      characterIds: characterIds || (character ? [character.id || character._id] : []),
      order: sceneCount,
      created_at: new Date().toISOString()
    };

    const result = await db.collection("scenes").insertOne(newScene);

    return Response.json({
      id: result.insertedId.toString(),
      projectId: projectId,
      user_id: userId,
      title: newScene.title,
      prompt: scene,
      generated_text: generatedText,
      tone: newScene.tone,
      characterIds: newScene.characterIds,
      order: newScene.order,
      created_at: newScene.created_at
    });
  } catch (error) {
    console.error("Create Scene Error:", error);
    const detail = error.response?.data?.detail || "Server error";
    return Response.json({ detail }, { status: 500 });
  }
}
