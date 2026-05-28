import chromadb

client = chromadb.PersistentClient(path="./chroma_db")

memory_collection = client.get_or_create_collection(
    name="scene_memories"
)