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
      created_at: result.created_at
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
