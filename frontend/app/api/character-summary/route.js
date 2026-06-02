import clientPromise from "@/lib/mongodb";
import { getUserIdFromRequest } from "@/lib/auth";
import { ObjectId } from "mongodb";
import axios from "axios";

export async function POST(req) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return Response.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    const { characterId } = await req.json();
    if (!characterId) {
      return Response.json({ detail: "Character ID is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("imaginai_db");

    // Fetch character
    const character = await db.collection("characters").findOne({
      _id: new ObjectId(characterId)
    });

    if (!character) {
      return Response.json({ detail: "Character not found" }, { status: 404 });
    }

    const projectId = character.project_id.toString();

    // Verify project belongs to user
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId),
      user_id: new ObjectId(userId)
    });

    if (!project) {
      return Response.json({ detail: "Project access unauthorized" }, { status: 403 });
    }

    // Fetch scenes featuring this character
    const scenes = await db.collection("scenes")
      .find({
        project_id: new ObjectId(projectId),
        characterIds: characterId
      })
      .sort({ order: 1, created_at: 1 })
      .toArray();

    // Map character and scenes to simple objects for python backend
    const mappedChar = {
      id: character._id.toString(),
      name: character.name,
      age: character.age,
      gender: character.gender,
      appearance: character.appearance || {},
      core_traits: character.core_traits || [],
      strengths: character.strengths || [],
      flaws: character.flaws || [],
      fears: character.fears || [],
      goals: character.goals || [],
      values: character.values || [],
      attachment_style: character.attachment_style || "",
      communication_style: character.communication_style || "",
      voice_style: character.voice_style || ""
    };

    const mappedScenes = scenes.map(s => ({
      id: s._id.toString(),
      title: s.title,
      prompt: s.prompt,
      direction: s.direction
    }));

    // Call python completions backend
    const backendUrl = process.env.AI_BACKEND_URL || "http://127.0.0.1:8000";
    const pythonRes = await axios.post(`${backendUrl}/character-summary`, {
      character: mappedChar,
      scenes: mappedScenes,
      story_bible: project.story_bible || {}
    });

    return Response.json(pythonRes.data);
  } catch (error) {
    console.error("Character Summary Error:", error);
    return Response.json({ detail: error.response?.data?.detail || "Server error" }, { status: 500 });
  }
}
