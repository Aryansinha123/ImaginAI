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
      age: c.age || "",
      gender: c.gender || "",
      appearance: c.appearance || {
        height: c.height || "",
        hair: c.hair || "",
        eyes: c.eyes || "",
        skinTone: c.skinTone || "",
        clothing: c.clothing || ""
      },
      core_traits: c.core_traits || (c.personality ? c.personality.split(",").map(t => t.trim()).filter(Boolean) : []),
      strengths: c.strengths || [],
      flaws: c.flaws || [],
      fears: c.fears || [],
      goals: c.goals || [],
      values: c.values || [],
      attachment_style: c.attachment_style || "",
      communication_style: c.communication_style || c.speakingStyle || "",
      voice_style: c.voice_style || c.voice || "",
      relationship_type: typeof c.relationship_type === 'object' && c.relationship_type !== null
        ? (c.relationship_type.emotion || c.relationship_type.relationship_type || "")
        : (c.relationship_type || (typeof c.relationship === 'object' && c.relationship !== null ? (c.relationship.emotion || c.relationship.relationship_type || "") : (c.relationship || ""))),
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
      appearance: characterData.appearance || {
        height: characterData.height || "",
        hair: characterData.hair || "",
        eyes: characterData.eyes || "",
        skinTone: characterData.skinTone || "",
        clothing: characterData.clothing || ""
      },
      core_traits: characterData.core_traits || [],
      strengths: characterData.strengths || [],
      flaws: characterData.flaws || [],
      fears: characterData.fears || [],
      goals: characterData.goals || [],
      values: characterData.values || [],
      attachment_style: characterData.attachment_style || "",
      communication_style: characterData.communication_style || "",
      voice_style: characterData.voice_style || "",
      relationship_type: characterData.relationship_type || "",
      avatarUrl: characterData.avatarUrl || "",
      created_at: new Date().toISOString()
    };

    const result = await db.collection("characters").insertOne(newCharacter);

    return Response.json({
      id: result.insertedId.toString(),
      projectId: projectId,
      user_id: userId,
      name: newCharacter.name,
      age: newCharacter.age,
      gender: newCharacter.gender,
      appearance: newCharacter.appearance,
      core_traits: newCharacter.core_traits,
      strengths: newCharacter.strengths,
      flaws: newCharacter.flaws,
      fears: newCharacter.fears,
      goals: newCharacter.goals,
      values: newCharacter.values,
      attachment_style: newCharacter.attachment_style,
      communication_style: newCharacter.communication_style,
      voice_style: newCharacter.voice_style,
      relationship_type: newCharacter.relationship_type,
      avatarUrl: newCharacter.avatarUrl,
      created_at: newCharacter.created_at
    });
  } catch (error) {
    console.error("Create Character Error:", error);
    return Response.json({ detail: "Server error" }, { status: 500 });
  }
}
