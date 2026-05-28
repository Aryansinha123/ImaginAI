import requests
import os
from dotenv import load_dotenv
from PIL import Image
from io import BytesIO
import uuid

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")

API_URL = (
    "https://router.huggingface.co/hf-inference/models/"
    "black-forest-labs/FLUX.1-schnell"
)

headers = {
    "Authorization": f"Bearer {HF_TOKEN}"
}

def generate_scene_image(prompt):

    response = requests.post(
        API_URL,
        headers=headers,
        json={
            "inputs": prompt
        },
        timeout=30
    )

    image = Image.open(
        BytesIO(response.content)
    )

    filename = f"{uuid.uuid4()}.png"

    os.makedirs("generated_images", exist_ok=True)

    save_path = f"generated_images/{filename}"

    image.save(save_path)

    return filename