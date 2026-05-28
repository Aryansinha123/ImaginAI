from vector_memory.chroma_client import memory_collection
from vector_memory.embedding_model import embedding_model
import uuid
import json

def store_single_memory(project_id, memory_data):
    if not isinstance(memory_data, dict):
        return

    embedding_text = memory_data.get("summary", "")
    if not embedding_text:
        return

    embedding = embedding_model.encode(
        embedding_text
    ).tolist()

    memory_collection.add(
        ids=[str(uuid.uuid4())],

        embeddings=[embedding],

        documents=[
            json.dumps(memory_data)
        ],

        metadatas=[
            {
                "project_id": project_id,
                "memory_type": memory_data.get("memory_type", "event"),
                "emotion": memory_data.get("emotion", "neutral"),
                "importance": memory_data.get("importance", 5)
            }
        ]
    )

def store_memory(project_id, memory_data):
    if isinstance(memory_data, list):
        for item in memory_data:
            store_single_memory(project_id, item)
    else:
        store_single_memory(project_id, memory_data)
def retrieve_memories(project_id, current_scene):

    query_embedding = embedding_model.encode(
        current_scene
    ).tolist()

    results = memory_collection.query(
        query_embeddings=[query_embedding],
        n_results=3,
        where={
            "project_id": project_id
        }
    )

    docs = results.get("documents", [])
    if docs and len(docs[0]) > 0:
        formatted_memories = []
        for doc in docs[0]:
            try:
                m = json.loads(doc)
                formatted_memories.append(
                    f"[{m.get('memory_type', 'Event').upper()} - Emotion: {m.get('emotion', 'N/A')} (Importance: {m.get('importance', 5)}/10)]: {m.get('summary')}"
                )
            except Exception:
                formatted_memories.append(doc)
        return "\n\n---\n\n".join(formatted_memories)
    
    return "No past memories found."