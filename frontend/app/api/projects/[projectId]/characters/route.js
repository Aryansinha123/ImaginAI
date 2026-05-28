import clientPromise from "@/lib/mongodb";
import { getUserIdFromRequest } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function GET(req, { params }) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return Response.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  try {
    const client = await clientPromise;
    const db = client.db("imaginai_db");

    console.log("DEBUG characters GET: projectId =", projectId, "userId =", userId);
    // Verify project exists and belongs to user
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId),
      user_id: new ObjectId(userId)
    });

    console.log("DEBUG characters GET: found project =", project);

    if (!project) {
      return Response.json({ detail: "Project not found" }, { status: 404 });
    }

    const characters = await db
      .collection("characters")
      .find({ project_id: new ObjectId(projectId) })
      .sort({ created_at: 1 })
      .toArray();

    const mapped = characters.map(c => ({
      id: c._id.toString(),
      projectId: c.project_id.toString(),
      user_id: c.user_id.toString(),
      name: c.name,
      age: c.age,
      gender: c.gender,
      height: c.height,
      hair: c.hair,
      eyes: c.eyes,
      skinTone: c.skinTone,
      clothing: c.clothing,
      personality: c.personality,
      voice: c.voice,
      relationship: c.relationship,
      emotionalTraits: c.emotionalTraits || "",
      speakingStyle: c.speakingStyle || "",
      avatarUrl: c.avatarUrl || "",
      created_at: c.created_at
    }));

    return Response.json(mapped);
  } catch (error) {
    console.error("Fetch Characters Error:", error);
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
    const characterData = await req.json();
    if (!characterData.name || characterData.name.trim().length === 0) {
      return Response.json({ detail: "Character name is required" }, { status: 400 });
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

    const newCharacter = {
      project_id: new ObjectId(projectId),
      user_id: new ObjectId(userId),
      name: characterData.name.trim(),
      age: characterData.age || "",
      gender: characterData.gender || "",
      height: characterData.height || "",
      hair: characterData.hair || "",
      eyes: characterData.eyes || "",
      skinTone: characterData.skinTone || "",
      clothing: characterData.clothing || "",
      personality: characterData.personality || "",
      voice: characterData.voice || "",
      relationship: characterData.relationship || "",
      emotionalTraits: characterData.emotionalTraits || "",
      speakingStyle: characterData.speakingStyle || "",
      avatarUrl: characterData.avatarUrl || "",
      created_at: new Date().toISOString()
    };

    const result = await db.collection("characters").insertOne(newCharacter);

    return Response.json({
      id: result.insertedId.toString(),
      projectId: projectId,
      user_id: userId,
      ...characterData,
      created_at: newCharacter.created_at
    });
  } catch (error) {
    console.error("Create Character Error:", error);
    return Response.json({ detail: "Server error" }, { status: 500 });
  }
}
