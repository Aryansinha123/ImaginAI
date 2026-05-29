import clientPromise from "@/lib/mongodb";
import { getUserIdFromRequest } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function PATCH(req, { params }) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return Response.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { projectId, characterId } = await params;

  try {
    const characterData = await req.json();
    
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

    const fieldsToUpdate = {};
    const allowedFields = [
      "name", "age", "gender", "appearance",
      "core_traits", "strengths", "flaws", "fears", "goals", "values",
      "attachment_style", "communication_style", "voice_style", "relationship_type",
      "avatarUrl"
    ];

    allowedFields.forEach((field) => {
      if (characterData[field] !== undefined) {
        fieldsToUpdate[field] = characterData[field];
      }
    });

    const result = await db.collection("characters").findOneAndUpdate(
      { _id: new ObjectId(characterId), project_id: new ObjectId(projectId) },
      { $set: fieldsToUpdate },
      { returnDocument: "after" }
    );

    if (!result) {
      return Response.json({ detail: "Character not found" }, { status: 404 });
    }

    return Response.json({
      id: result._id.toString(),
      projectId: result.project_id.toString(),
      user_id: result.user_id.toString(),
      name: result.name,
      age: result.age || "",
      gender: result.gender || "",
      appearance: result.appearance || {
        height: result.height || "",
        hair: result.hair || "",
        eyes: result.eyes || "",
        skinTone: result.skinTone || "",
        clothing: result.clothing || ""
      },
      core_traits: result.core_traits || [],
      strengths: result.strengths || [],
      flaws: result.flaws || [],
      fears: result.fears || [],
      goals: result.goals || [],
      values: result.values || [],
      attachment_style: result.attachment_style || "",
      communication_style: result.communication_style || "",
      voice_style: result.voice_style || "",
      relationship_type: typeof result.relationship_type === 'object' && result.relationship_type !== null
        ? (result.relationship_type.emotion || result.relationship_type.relationship_type || "")
        : (result.relationship_type || ""),
      avatarUrl: result.avatarUrl || "",
      created_at: result.created_at
    });
  } catch (error) {
    console.error("Update Character Error:", error);
    return Response.json({ detail: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return Response.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { projectId, characterId } = await params;

  try {
    const client = await clientPromise;
    const db = client.db("imaginai_db");

    // Verify project exists and belongs to user
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId),
      user_id: new ObjectId(userId)
    });

    if (!project) {
      return Response.json({ detail: "Project not found or unauthorized" }, { status: 404 });
    }

    const charResult = await db.collection("characters").deleteOne({
      _id: new ObjectId(characterId),
      project_id: new ObjectId(projectId)
    });

    if (charResult.deletedCount === 0) {
      return Response.json({ detail: "Character not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Delete Character Error:", error);
    return Response.json({ detail: "Server error" }, { status: 500 });
  }
}
