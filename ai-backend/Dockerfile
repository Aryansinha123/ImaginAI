FROM python:3.10-slim

# Install system dependencies, including FFmpeg and build-essential for ChromaDB/sqlite
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements file first to cache installation
COPY requirements.txt .

# Install CPU-only PyTorch first to keep image size small
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Install other python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the SentenceTransformer model during the build phase so it's baked into the image
# and does not download on every container boot or timeout on slow starts
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Copy the rest of the backend files
COPY . .

# Expose FastAPI port
EXPOSE 8000

# Start backend using uvicorn
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
