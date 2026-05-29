import chromadb

_client = None
_collection = None


def get_memory_collection():
    global _client, _collection
    if _collection is None:
        _client = chromadb.PersistentClient(path="./chroma_db")
        _collection = _client.get_or_create_collection(name="scene_memories")
    return _collection
