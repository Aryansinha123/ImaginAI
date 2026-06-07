import os
import shutil
import subprocess
import sys

# 1. Define paths inside the container
persistent_dir = "/app/persistent_data"
chroma_db_dir = os.path.join(persistent_dir, "chroma_db")
data_dir = os.path.join(persistent_dir, "data")
images_dir = os.path.join(persistent_dir, "generated_images")

# Ensure persistent directories exist inside the volume
os.makedirs(chroma_db_dir, exist_ok=True)
os.makedirs(data_dir, exist_ok=True)
os.makedirs(images_dir, exist_ok=True)

# 2. Copy default JSON files from the image to the volume if they don't exist yet
local_data_dir = "/app/data"
if os.path.exists(local_data_dir):
    for filename in os.listdir(local_data_dir):
        if filename.endswith(".json"):
            src = os.path.join(local_data_dir, filename)
            dst = os.path.join(data_dir, filename)
            if not os.path.exists(dst):
                try:
                    shutil.copy2(src, dst)
                    print(f"Copied default data file {filename} to persistent volume")
                except Exception as e:
                    print(f"Error copying {filename}: {e}")

# 3. Create symlinks for chroma_db and generated_images
symlinks = [
    ("/app/chroma_db", chroma_db_dir),
    ("/app/generated_images", images_dir)
]

for link_path, target_path in symlinks:
    # Remove existing directory or file if it exists and is not a symlink
    if os.path.exists(link_path) and not os.path.islink(link_path):
        try:
            if os.path.isdir(link_path):
                shutil.rmtree(link_path)
            else:
                os.remove(link_path)
        except Exception as e:
            print(f"Error removing existing path {link_path}: {e}")

    # Create the symlink pointing to the volume directory
    if not os.path.exists(link_path):
        try:
            os.symlink(target_path, link_path)
            print(f"Created symlink: {link_path} -> {target_path}")
        except Exception as e:
            print(f"Error creating symlink {link_path}: {e}")

# 4. Create symlinks for individual JSON files in the data directory
json_files = ["relationships.json", "emotions.json", "character_arcs.json", "story_bibles.json"]
for filename in json_files:
    link_path = os.path.join(local_data_dir, filename)
    target_path = os.path.join(data_dir, filename)

    # Remove existing JSON file if it exists and is not a symlink
    if os.path.exists(link_path) and not os.path.islink(link_path):
        try:
            os.remove(link_path)
        except Exception as e:
            print(f"Error removing {link_path}: {e}")

    # Create symlink pointing to the JSON file inside the persistent volume
    if not os.path.exists(link_path) and os.path.exists(target_path):
        try:
            os.symlink(target_path, link_path)
            print(f"Created symlink: {link_path} -> {target_path}")
        except Exception as e:
            print(f"Error creating symlink {link_path}: {e}")

# 5. Start the FastAPI server on the dynamically assigned port
port = os.getenv("PORT", "8000")
cmd = ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", port]
print(f"Starting uvicorn on port {port}...")
sys.exit(subprocess.call(cmd))
