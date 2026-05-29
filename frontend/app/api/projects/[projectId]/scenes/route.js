import clientPromise from "@/lib/mongodb";
import { getUserIdFromRequest } from "@/lib/auth";
import { ObjectId } from "mongodb";
import axios from "axios";

async function getAncestors(db, parentId, limit = 3) {
  const ancestors = [];
  let currentId = parentId;
  while (currentId && ancestors.length < limit) {
    let queryId;
    try {
      queryId = new ObjectId(currentId);
    } catch (e) {
      break;
    }
    const sceneObj = await db.collection("scenes").findOne({ _id: queryId });
    if (!sceneObj) break;
    ancestors.push(sceneObj);
    currentId = sceneObj.parent_id ? sceneObj.parent_id.toString() : null;
  }
  return ancestors.reverse();
}

async function getAccumulatedEmotionsFromDb(db, projectId, startSceneId) {
  const emotions = {};
  const resolvedKeys = new Set();
  let currentId = startSceneId;

  while (currentId) {
    let queryId;
    try {
      queryId = new ObjectId(currentId);
    } catch (e) {
      break;
    }
    const sceneObj = await db.collection("scenes").findOne({
      _id: queryId,
      project_id: new ObjectId(projectId)
    });
    if (!sceneObj) break;

    if (sceneObj.emotion_deltas) {
      for (const [key, deltas] of Object.entries(sceneObj.emotion_deltas)) {
        if (!resolvedKeys.has(key)) {
          const values = {};
          for (const [emName, emVal] of Object.entries(deltas)) {
            values[emName] = typeof emVal === 'number' ? emVal : (emVal.new !== undefined ? emVal.new : emVal);
          }
          emotions[key] = values;
          resolvedKeys.add(key);
        }
      }
    }
    currentId = sceneObj.parent_id ? sceneObj.parent_id.toString() : null;
  }
  return emotions;
}

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
      emotion_deltas: s.emotion_deltas || {},
      hidden_thoughts: s.hidden_thoughts || {},
      parent_id: s.parent_id || null,
      branch_id: s.branch_id || "main",
      decision: s.decision || null
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
    const { scene, characterIds, character, title, tone, generated_text, parent_id, branch_id, decision } = await req.json();
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

    // Fetch last 3 scenes as past memories for cinematic continuity (branch-aware)
    let pastScenes = [];
    if (parent_id) {
      pastScenes = await getAncestors(db, parent_id, 3);
    } else {
      pastScenes = await db.collection("scenes")
        .find({ project_id: new ObjectId(projectId), branch_id: "main" })
        .sort({ order: 1, created_at: 1 })
        .limit(3)
        .toArray();
      if (pastScenes.length === 0) {
        pastScenes = await db.collection("scenes")
          .find({ project_id: new ObjectId(projectId) })
          .sort({ order: 1, created_at: 1 })
          .limit(3)
          .toArray();
      }
    }

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
    let ancestorEmotions = {};
    if (parent_id) {
      ancestorEmotions = await getAccumulatedEmotionsFromDb(db, projectId, parent_id);
    }

    if (assignedCharacters.length > 1) {
      for (let i = 0; i < assignedCharacters.length; i++) {
        for (let j = 0; j < assignedCharacters.length; j++) {
          if (i !== j) {
            const charA = assignedCharacters[i];
            const charB = assignedCharacters[j];
            const nameKey = `${charA.name}->${charB.name}`;

            if (ancestorEmotions[nameKey]) {
              relationships[nameKey] = ancestorEmotions[nameKey];
            } else if (project.canvas_edges) {
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
            } else {
              relationships[nameKey] = { trust: 50, attachment: 50, awkwardness: 0, resentment: 0, comfort: 50 };
            }
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

      if (apiRes.data.updated_emotions) {
        const nameToChar = {};
        assignedCharacters.forEach(c => {
          nameToChar[c.name.toLowerCase()] = c;
        });

        Object.keys(apiRes.data.updated_emotions).forEach(key => {
          const parts = key.split("->");
          if (parts.length === 2) {
            const fromName = parts[0].trim().toLowerCase();
            const toName = parts[1].trim().toLowerCase();
            const fromChar = nameToChar[fromName];
            const toChar = nameToChar[toName];

            if (fromChar && toChar) {
              const newEms = apiRes.data.updated_emotions[key];

              // Base emotions
              let currentEms = ancestorEmotions[key] || null;
              if (!currentEms && project.canvas_edges) {
                const edge = project.canvas_edges.find(e =>
                  (e.source === fromChar._id.toString() && e.target === toChar._id.toString()) ||
                  (e.source === toChar._id.toString() && e.target === fromChar._id.toString())
                );
                if (edge && edge.emotions) {
                  const isSource = edge.source === fromChar._id.toString();
                  if (isSource && edge.emotions.source_to_target) {
                    currentEms = edge.emotions.source_to_target;
                  } else if (!isSource && edge.emotions.target_to_source) {
                    currentEms = edge.emotions.target_to_source;
                  } else if (typeof edge.emotions.trust === "number") {
                    currentEms = edge.emotions;
                  }
                }
              }
              if (!currentEms) {
                currentEms = { trust: 50, attachment: 50, awkwardness: 0, resentment: 0, comfort: 50 };
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
            }
          }
        });
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
      hidden_thoughts: hiddenThoughts || {},
      parent_id: parent_id ? parent_id.toString() : null,
      branch_id: branch_id || "main",
      decision: decision || null
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
      hidden_thoughts: newScene.hidden_thoughts || {},
      parent_id: newScene.parent_id || null,
      branch_id: newScene.branch_id || "main",
      decision: newScene.decision || null
    });
  } catch (error) {
    console.error("Create Scene Error:", error);
    const detail = error.response?.data?.detail || "Server error";
    return Response.json({ detail }, { status: 500 });
  }
}
