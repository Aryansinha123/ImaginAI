import clientPromise from "@/lib/mongodb";
import { getUserIdFromRequest } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function GET(req) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return Response.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db("imaginai_db");
    
    const projects = await db
      .collection("projects")
      .find({ user_id: new ObjectId(userId) })
      .sort({ created_at: -1 })
      .toArray();

    const mapped = projects.map(p => ({
      id: p._id.toString(),
      name: p.name,
      theme: p.theme || "default",
      user_id: p.user_id.toString(),
      created_at: p.created_at
    }));

    return Response.json(mapped);
  } catch (error) {
    console.error("Fetch Projects Error:", error);
    return Response.json({ detail: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return Response.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name } = await req.json();
    if (!name || name.trim().length === 0) {
      return Response.json({ detail: "Project name is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("imaginai_db");

    const newProject = {
      name: name.trim(),
      user_id: new ObjectId(userId),
      theme: "default",
      created_at: new Date().toISOString()
    };

    const result = await db.collection("projects").insertOne(newProject);
    
    return Response.json({
      id: result.insertedId.toString(),
      name: newProject.name,
      theme: newProject.theme,
      user_id: userId,
      created_at: newProject.created_at
    });
  } catch (error) {
    console.error("Create Project Error:", error);
    return Response.json({ detail: "Server error" }, { status: 500 });
  }
}
