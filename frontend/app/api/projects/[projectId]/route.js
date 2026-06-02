import clientPromise from "@/lib/mongodb";
import { getUserIdFromRequest } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function PATCH(req, { params }) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return Response.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  try {
    const { name, theme } = await req.json();
    
    const updateData = {};
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return Response.json({ detail: "Project name is required" }, { status: 400 });
      }
      updateData.name = name.trim();
    }
    if (theme !== undefined) {
      updateData.theme = theme;
    }

    if (Object.keys(updateData).length === 0) {
      return Response.json({ detail: "No update parameters provided" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("imaginai_db");

    const result = await db.collection("projects").findOneAndUpdate(
      { _id: new ObjectId(projectId), user_id: new ObjectId(userId) },
      { $set: updateData },
      { returnDocument: "after" }
    );

    if (!result) {
      return Response.json({ detail: "Project not found or unauthorized" }, { status: 404 });
    }

    return Response.json({
      id: result._id.toString(),
      name: result.name,
      theme: result.theme || "default",
      user_id: result.user_id.toString(),
      created_at: result.created_at
    });
  } catch (error) {
    console.error("Update Project Error:", error);
    return Response.json({ detail: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return Response.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  try {
    const client = await clientPromise;
    const db = client.db("imaginai_db");

    // Delete project
    const projResult = await db.collection("projects").deleteOne({
      _id: new ObjectId(projectId),
      user_id: new ObjectId(userId)
    });

    if (projResult.deletedCount === 0) {
      return Response.json({ detail: "Project not found or unauthorized" }, { status: 404 });
    }

    // Cascade delete characters and scenes for this project
    await Promise.all([
      db.collection("characters").deleteMany({ project_id: new ObjectId(projectId) }),
      db.collection("scenes").deleteMany({ project_id: new ObjectId(projectId) })
    ]);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Delete Project Error:", error);
    return Response.json({ detail: "Server error" }, { status: 500 });
  }
}
