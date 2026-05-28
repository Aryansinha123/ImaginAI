import clientPromise from "@/lib/mongodb";
import { getUserIdFromRequest } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function POST(req, { params }) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return Response.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  try {
    const { sceneIds } = await req.json();
    if (!sceneIds || !Array.isArray(sceneIds)) {
      return Response.json({ detail: "Invalid sceneIds payload" }, { status: 400 });
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

    // Bulk update the order index of each scene
    const updates = sceneIds.map((id, index) => 
      db.collection("scenes").updateOne(
        { _id: new ObjectId(id), project_id: new ObjectId(projectId) },
        { $set: { order: index } }
      )
    );

    await Promise.all(updates);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Reorder Scenes Error:", error);
    return Response.json({ detail: "Server error" }, { status: 500 });
  }
}
