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

    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId),
      user_id: new ObjectId(userId)
    });

    if (!project) {
      return Response.json({ detail: "Project not found" }, { status: 404 });
    }

    return Response.json({
      nodes: project.canvas_nodes || [],
      edges: project.canvas_edges || []
    });
  } catch (error) {
    console.error("Fetch Canvas Error:", error);
    return Response.json({ detail: "Server error" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return Response.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  try {
    const { nodes, edges } = await req.json();

    const client = await clientPromise;
    const db = client.db("imaginai_db");

    const result = await db.collection("projects").updateOne(
      {
        _id: new ObjectId(projectId),
        user_id: new ObjectId(userId)
      },
      {
        $set: {
          canvas_nodes: nodes || [],
          canvas_edges: edges || []
        }
      }
    );

    if (result.matchedCount === 0) {
      return Response.json({ detail: "Project not found" }, { status: 404 });
    }

    return Response.json({ success: true, nodes, edges });
  } catch (error) {
    console.error("Update Canvas Error:", error);
    return Response.json({ detail: "Server error" }, { status: 500 });
  }
}
