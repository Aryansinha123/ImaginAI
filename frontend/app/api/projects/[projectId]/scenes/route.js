import clientPromise from "@/lib/mongodb";
import { getUserIdFromRequest } from "@/lib/auth";
import { ObjectId } from "mongodb";
import axios from "axios";

export async function GET(req, { params }) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return Response.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  try {
    const client = await clientPromise;
    const db = client.db("imaginai_db");

    console.log("DEBUG scenes GET: projectId =", projectId, "userId =", userId);
    // Verify project exists and belongs to user
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId),
      user_id: new ObjectId(userId)
    });

    console.log("DEBUG scenes GET: found project =", project);

    if (!project) {
      return Response.json({ detail: "Project not found" }, { status: 404 });
    }

    const scenes = await db
      .collection("scenes")
      .find({ project_id: new ObjectId(projectId) })
      .sort({ order: 1, created_at: 1 })
      .toArray();

    const mapped = scenes.map(s => ({
      id: s._id.toString(),
      projectId: s.project_id.toString(),
      user_id: s.user_id.toString(),
      title: s.title || "Untitled Scene",
      prompt: s.prompt,
      generated_text: s.generated_text,
      tone: s.tone || "neutral",
      characterIds: s.characterIds || [],
      order: s.order !== undefined ? s.order : 0,
      created_at: s.created_at,
      images: s.images || (s.image ? [s.image] : []),
      image: s.image,
      direction: s.direction,
      hidden_thoughts: s.hidden_thoughts || {}
    }));

    return Response.json(mapped);
  } catch (error) {
    console.error("Fetch Scenes Error:", error);
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
    const { scene, characterIds, character, title, tone, generated_text } = await req.json();
    if (!scene) {
      return Response.json({ detail: "Missing scene prompt" }, { status: 400 });
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

    // Resolve multiple characters details from DB
    let assignedCharacters = [];
    const resolvedIds = (characterIds || []).map(id => new ObjectId(id));
    if (resolvedIds.length > 0) {
      assignedCharacters = await db.collection("characters")
        .find({ _id: { $in: resolvedIds } })
        .toArray();
    } else if (character) {
      assignedCharacters = [character];
    }

    // Fetch last 3 scenes as past memories for cinematic continuity
    const pastScenes = await db.collection("scenes")
      .find({ project_id: new ObjectId(projectId) })
      .sort({ order: 1, created_at: 1 })
      .limit(3)
      .toArray();

    const past_memories = pastScenes.length > 0 
      ? pastScenes.map(s => {
          const truncatedStory = s.generated_text 
            ? (s.generated_text.length > 800 ? s.generated_text.substring(0, 800) + "... [truncated]" : s.generated_text)
            : "No text generated.";
          return `Scene Title: ${s.title || "Untitled"}\nScene Prompt: ${s.prompt}\nEnhanced Story: ${truncatedStory}`;
        }).join("\n\n")
      : "No previous events recorded.";

    // Gather directional relationship state for all character pairs in the scene
    const relationships = {};
    if (assignedCharacters.length > 1 && project.canvas_edges) {
      for (let i = 0; i < assignedCharacters.length; i++) {
        for (let j = 0; j < assignedCharacters.length; j++) {
          if (i !== j) {
            const charA = assignedCharacters[i];
            const charB = assignedCharacters[j];
            const nameKey = `${charA.name}->${charB.name}`;

            const edge = project.canvas_edges.find(e =>
              (e.source === charA._id.toString() && e.target === charB._id.toString()) ||
              (e.source === charB._id.toString() && e.target === charA._id.toString())
            );

            let emotions = { trust: 50, attachment: 50, awkwardness: 0, resentment: 0, comfort: 50 };
            if (edge && edge.emotions) {
              if (edge.source === charA._id.toString() && edge.emotions.source_to_target) {
                emotions = edge.emotions.source_to_target;
              } else if (edge.target === charA._id.toString() && edge.emotions.target_to_source) {
                emotions = edge.emotions.target_to_source;
              } else if (typeof edge.emotions.trust === "number") {
                emotions = edge.emotions;
              }
            }
            relationships[nameKey] = emotions;
          }
        }
      }
    }

    let generatedText = generated_text;
    let emotionDeltas = {};
    let directionData = null;
    let imageFilename = null;
    let imageFilenames = [];
    let hiddenThoughts = {};

    if (!generatedText) {
      // Call stateless FastAPI completions backend
      const apiRes = await axios.post("http://127.0.0.1:8000/generate-scene", {
        scene,
        characters: assignedCharacters,
        tone: tone || "neutral",
        past_memories,
        relationships: relationships
      });
      generatedText = apiRes.data.scene;
      directionData = apiRes.data.direction;
      imageFilename = apiRes.data.image || null;
      imageFilenames = apiRes.data.images || (apiRes.data.image ? [apiRes.data.image] : []);
      hiddenThoughts = apiRes.data.hidden_thoughts || {};
      
      console.log("Python response:", apiRes.data);

      if (apiRes.data.updated_emotions && project.canvas_edges) {
        const nameToChar = {};
        assignedCharacters.forEach(c => {
          nameToChar[c.name.toLowerCase()] = c;
        });

        let updatedEdges = [...project.canvas_edges];

        Object.keys(apiRes.data.updated_emotions).forEach(key => {
          const parts = key.split("->");
          if (parts.length === 2) {
            const fromName = parts[0].trim().toLowerCase();
            const toName = parts[1].trim().toLowerCase();
            const fromChar = nameToChar[fromName];
            const toChar = nameToChar[toName];

            if (fromChar && toChar) {
              const fromId = fromChar._id.toString();
              const toId = toChar._id.toString();
              const newEms = apiRes.data.updated_emotions[key];

              let edgeIndex = updatedEdges.findIndex(e =>
                (e.source === fromId && e.target === toId) ||
                (e.source === toId && e.target === fromId)
              );

              if (edgeIndex !== -1) {
                const edge = updatedEdges[edgeIndex];
                const isSource = edge.source === fromId;

                let currentEms = { trust: 50, attachment: 50, awkwardness: 0, resentment: 0, comfort: 50 };
                if (edge.emotions) {
                  if (isSource && edge.emotions.source_to_target) {
                    currentEms = edge.emotions.source_to_target;
                  } else if (!isSource && edge.emotions.target_to_source) {
                    currentEms = edge.emotions.target_to_source;
                  } else if (typeof edge.emotions.trust === "number") {
                    currentEms = edge.emotions;
                  }
                }

                const deltas = {};
                Object.keys(newEms).forEach(k => {
                  const lowerK = k.toLowerCase();
                  if (currentEms[lowerK] !== undefined) {
                    deltas[lowerK] = {
                      previous: currentEms[lowerK],
                      new: newEms[k],
                      delta: newEms[k] - currentEms[lowerK]
                    };
                  }
                });
                emotionDeltas[key] = deltas;

                let updatedEdgeEmotions = edge.emotions && typeof edge.emotions.source_to_target === "object"
                  ? { ...edge.emotions }
                  : {
                      source_to_target: { trust: 50, attachment: 50, awkwardness: 0, resentment: 0, comfort: 50 },
                      target_to_source: { trust: 50, attachment: 50, awkwardness: 0, resentment: 0, comfort: 50 }
                    };

                if (edge.emotions && typeof edge.emotions.trust === "number") {
                  updatedEdgeEmotions.source_to_target = { ...edge.emotions };
                  updatedEdgeEmotions.target_to_source = { ...edge.emotions };
                }

                if (isSource) {
                  updatedEdgeEmotions.source_to_target = { ...updatedEdgeEmotions.source_to_target, ...newEms };
                } else {
                  updatedEdgeEmotions.target_to_source = { ...updatedEdgeEmotions.target_to_source, ...newEms };
                }

                updatedEdges[edgeIndex] = {
                  ...edge,
                  emotions: updatedEdgeEmotions
                };
              }
            }
          }
        });

        await db.collection("projects").updateOne(
          { _id: new ObjectId(projectId) },
          { $set: { canvas_edges: updatedEdges } }
        );
      }
    }
    const sceneCount = await db.collection("scenes").countDocuments({ project_id: new ObjectId(projectId) });

    const newScene = {
      project_id: new ObjectId(projectId),
      user_id: new ObjectId(userId),
      title: title?.trim() || "Untitled Scene",
      prompt: scene,
      generated_text: generatedText || "",
      tone: tone || "neutral",
      characterIds: characterIds || (character ? [character.id || character._id] : []),
      order: sceneCount,
      created_at: new Date().toISOString(),
      emotion_deltas: emotionDeltas || {},
      direction: directionData || null,
      images: imageFilenames || [],
      image: imageFilename,
      hidden_thoughts: hiddenThoughts || {}
    };

    const result = await db.collection("scenes").insertOne(newScene);

    return Response.json({
      id: result.insertedId.toString(),
      projectId: projectId,
      user_id: userId,
      title: newScene.title,
      prompt: scene,
      generated_text: generatedText || "",
      tone: newScene.tone,
      characterIds: newScene.characterIds,
      order: newScene.order,
      created_at: newScene.created_at,
      emotion_deltas: emotionDeltas || {},
      direction: directionData || null,
      images: newScene.images,
      image: newScene.image || null,
      hidden_thoughts: newScene.hidden_thoughts || {}
    });
  } catch (error) {
    console.error("Create Scene Error:", error);
    const detail = error.response?.data?.detail || "Server error";
    return Response.json({ detail }, { status: 500 });
  }
}
