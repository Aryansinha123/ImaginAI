import clientPromise from "@/lib/mongodb";
import { getUserIdFromRequest } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function GET(req) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return Response.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return Response.json({ detail: "Missing projectId parameter" }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db("imaginai_db");

    // Verify project belongs to user
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId),
      user_id: new ObjectId(userId)
    });

    if (!project) {
      return Response.json({ detail: "Project not found" }, { status: 404 });
    }

    // Fetch characters
    const characters = await db.collection("characters")
      .find({ project_id: new ObjectId(projectId) })
      .toArray();

    // Fetch scenes
    const scenes = await db.collection("scenes")
      .find({ project_id: new ObjectId(projectId) })
      .toArray();

    // Map nodes
    const nodes = characters.map(char => {
      const sceneCount = scenes.filter(s => s.characterIds?.includes(char._id.toString())).length;
      return {
        id: char._id.toString(),
        name: char.name,
        avatarUrl: char.avatarUrl || "",
        sceneCount: sceneCount
      };
    });

    // Map edges from project canvas state
    const canvasEdges = project.canvas_edges || [];
    const edges = canvasEdges.map(edge => {
      let trust = 50;
      let attachment = 50;
      let comfort = 50;
      let awkwardness = 0;
      let resentment = 0;

      if (edge.emotions) {
        const ems = edge.emotions.source_to_target || edge.emotions;
        trust = ems.trust ?? 50;
        attachment = ems.attachment ?? 50;
        comfort = ems.comfort ?? 50;
        awkwardness = ems.awkwardness ?? 0;
        resentment = ems.resentment ?? 0;
      }

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        trust,
        attachment,
        comfort,
        awkwardness,
        resentment,
        status: edge.label || "Connected"
      };
    });

    return Response.json({ nodes, edges });
  } catch (error) {
    console.error("Relationships API Error:", error);
    return Response.json({ detail: "Server error" }, { status: 500 });
  }
}
