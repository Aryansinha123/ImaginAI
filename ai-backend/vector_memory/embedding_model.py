# Patch torch to avoid AttributeError: module 'torch' has no attribute 'float8_e8m0fnu'
# which occurs in newer versions of the 'transformers' library in CPU-only environments.
import torch
if not hasattr(torch, "float8_e8m0fnu"):
    setattr(torch, "float8_e8m0fnu", torch.float32)

from sentence_transformers import SentenceTransformer

_model = None


def get_embedding_model():
    """Lazy-load the transformer so uvicorn reload starts quickly on Windows."""
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model
