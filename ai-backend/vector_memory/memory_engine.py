from vector_memory.chroma_client import memory_collection
from vector_memory.embedding_model import embedding_model
import uuid

def store_memory(project_id, scene_text):

    embedding = embedding_model.encode(scene_text).tolist()

    memory_collection.add(
        ids=[str(uuid.uuid4())],
        embeddings=[embedding],
        documents=[scene_text],
        metadatas=[
            {
                "project_id": project_id
            }
        ]
    )

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
        return "\n\n---\n\n".join(docs[0])
    
    return "No past memories found."