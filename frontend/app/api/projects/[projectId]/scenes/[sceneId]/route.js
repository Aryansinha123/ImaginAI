import clientPromise from "@/lib/mongodb";
import { getUserIdFromRequest } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function PATCH(req, { params }) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return Response.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { projectId, sceneId } = await params;

  try {
    const updateData = await req.json();
    
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

    // Build update object
    const fieldsToUpdate = {};
    if (updateData.title !== undefined) fieldsToUpdate.title = updateData.title;
    if (updateData.prompt !== undefined) fieldsToUpdate.prompt = updateData.prompt;
    if (updateData.tone !== undefined) fieldsToUpdate.tone = updateData.tone;
    if (updateData.characterIds !== undefined) fieldsToUpdate.characterIds = updateData.characterIds;
    if (updateData.order !== undefined) fieldsToUpdate.order = updateData.order;
    if (updateData.generated_text !== undefined) fieldsToUpdate.generated_text = updateData.generated_text;
    if (updateData.direction !== undefined) fieldsToUpdate.direction = updateData.direction || null;
    if (updateData.image !== undefined) fieldsToUpdate.image = updateData.image || null;
    if (updateData.images !== undefined) fieldsToUpdate.images = updateData.images || [];
    if (updateData.hidden_thoughts !== undefined) fieldsToUpdate.hidden_thoughts = updateData.hidden_thoughts || {};
    if (updateData.parent_id !== undefined) fieldsToUpdate.parent_id = updateData.parent_id || null;
    if (updateData.branch_id !== undefined) fieldsToUpdate.branch_id = updateData.branch_id || "main";
    if (updateData.decision !== undefined) fieldsToUpdate.decision = updateData.decision || null;
    if (updateData.emotion_deltas !== undefined) fieldsToUpdate.emotion_deltas = updateData.emotion_deltas || {};

    const result = await db.collection("scenes").findOneAndUpdate(
      { _id: new ObjectId(sceneId), project_id: new ObjectId(projectId) },
      { $set: fieldsToUpdate },
      { returnDocument: "after" }
    );

    if (!result) {
      return Response.json({ detail: "Scene not found" }, { status: 404 });
    }

    return Response.json({
      id: result._id.toString(),
      projectId: result.project_id.toString(),
      user_id: result.user_id.toString(),
      title: result.title,
      prompt: result.prompt,
      tone: result.tone,
      characterIds: result.characterIds || [],
      order: result.order !== undefined ? result.order : 0,
      generated_text: result.generated_text,
      created_at: result.created_at,
      direction: result.direction || null,
      emotion_deltas: result.emotion_deltas || {},
      images: result.images || (result.image ? [result.image] : []),
      image: result.image || null,
      hidden_thoughts: result.hidden_thoughts || {},
      parent_id: result.parent_id || null,
      branch_id: result.branch_id || "main",
      decision: result.decision || null
    });
  } catch (error) {
    console.error("Update Scene Error:", error);
    return Response.json({ detail: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return Response.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { projectId, sceneId } = await params;

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

    const sceneResult = await db.collection("scenes").deleteOne({
      _id: new ObjectId(sceneId),
      project_id: new ObjectId(projectId)
    });

    if (sceneResult.deletedCount === 0) {
      return Response.json({ detail: "Scene not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Delete Scene Error:", error);
    return Response.json({ detail: "Server error" }, { status: 500 });
  }
}
