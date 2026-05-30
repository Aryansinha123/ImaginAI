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
    if (updateData.clips !== undefined) fieldsToUpdate.clips = updateData.clips || [];
    if (updateData.hidden_thoughts !== undefined) fieldsToUpdate.hidden_thoughts = updateData.hidden_thoughts || {};
    if (updateData.parent_id !== undefined) fieldsToUpdate.parent_id = updateData.parent_id || null;
    if (updateData.branch_id !== undefined) fieldsToUpdate.branch_id = updateData.branch_id || "main";
    if (updateData.decision !== undefined) fieldsToUpdate.decision = updateData.decision || null;
    if (updateData.emotion_deltas !== undefined) fieldsToUpdate.emotion_deltas = updateData.emotion_deltas || {};
    if (updateData.storyboard !== undefined) fieldsToUpdate.storyboard = updateData.storyboard || [];
    if (updateData.storyboards !== undefined) fieldsToUpdate.storyboards = updateData.storyboards || [];

    const result = await db.collection("scenes").findOneAndUpdate(
      { _id: new ObjectId(sceneId), project_id: new ObjectId(projectId) },
      { $set: fieldsToUpdate },
      { returnDocument: "after" }
    );

    if (!result) {
      return Response.json({ detail: "Scene not found" }, { status: 404 });
    }

    // If emotion_deltas are updated, update the project's canvas_edges in MongoDB
    if (updateData.emotion_deltas && Object.keys(updateData.emotion_deltas).length > 0 && project.canvas_edges) {
      const characterIds = result.characterIds || [];
      const resolvedIds = characterIds.map(id => new ObjectId(id));
      const assignedCharacters = await db.collection("characters")
        .find({ _id: { $in: resolvedIds } })
        .toArray();

      const updatedEdges = project.canvas_edges.map(edge => {
        const sourceChar = assignedCharacters.find(c => c._id.toString() === edge.source);
        const targetChar = assignedCharacters.find(c => c._id.toString() === edge.target);
        if (sourceChar && targetChar) {
          const keyST = `${sourceChar.name}->${targetChar.name}`;
          const keyTS = `${targetChar.name}->${sourceChar.name}`;

          const emotions = edge.emotions ? { ...edge.emotions } : {
            source_to_target: { trust: 50, attachment: 50, awkwardness: 0, resentment: 0, comfort: 50 },
            target_to_source: { trust: 50, attachment: 50, awkwardness: 0, resentment: 0, comfort: 50 }
          };

          if (updateData.emotion_deltas[keyST]) {
            const stNew = {};
            for (const [emName, emObj] of Object.entries(updateData.emotion_deltas[keyST])) {
              stNew[emName] = emObj.new;
            }
            emotions.source_to_target = { ...emotions.source_to_target, ...stNew };
          }
          if (updateData.emotion_deltas[keyTS]) {
            const tsNew = {};
            for (const [emName, emObj] of Object.entries(updateData.emotion_deltas[keyTS])) {
              tsNew[emName] = emObj.new;
            }
            emotions.target_to_source = { ...emotions.target_to_source, ...tsNew };
          }

          const primaryEmotions = emotions.source_to_target || emotions;
          const trust = primaryEmotions.trust ?? 50;
          let stroke = "#eab308";
          if (trust <= 30) stroke = "#ef4444";
          else if (trust > 70) stroke = "#22c55e";

          const cleanLabel = edge.label ? edge.label.split(" (Trust:")[0] : "Connected";

          return {
            ...edge,
            label: `${cleanLabel} (Trust: ${trust}%)`,
            style: { stroke, strokeWidth: 2.5 },
            emotions
          };
        }
        return edge;
      });

      await db.collection("projects").updateOne(
        { _id: new ObjectId(projectId) },
        { $set: { canvas_edges: updatedEdges } }
      );
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
      clips: result.clips || [],
      hidden_thoughts: result.hidden_thoughts || {},
      parent_id: result.parent_id || null,
      branch_id: result.branch_id || "main",
      decision: result.decision || null,
      storyboard: result.storyboard || [],
      storyboards: result.storyboards || []
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
