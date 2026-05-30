import requests
import os
from dotenv import load_dotenv
from PIL import Image
from io import BytesIO
import uuid

load_dotenv()

API_URL = (
    "https://router.huggingface.co/hf-inference/models/"
    "black-forest-labs/FLUX.1-schnell"
)

def generate_scene_image(prompt):
    hf_token = os.getenv("HF_TOKEN")
    headers = {
        "Authorization": f"Bearer {hf_token}"
    }

    response = requests.post(
        API_URL,
        headers=headers,
        json={
            "inputs": prompt
        },
        timeout=30
    )

    if response.status_code != 200:
        print(f"HuggingFace API error: Status {response.status_code}, Response: {response.text}")
        raise Exception(f"HuggingFace API error: {response.status_code} - {response.text[:200]}")

    try:
        image = Image.open(
            BytesIO(response.content)
        )
    except Exception as e:
        print(f"Failed to parse HuggingFace response content as image. Content preview: {response.content[:200]}")
        raise e

    filename = f"{uuid.uuid4()}.png"

    os.makedirs("generated_images", exist_ok=True)

    save_path = f"generated_images/{filename}"

    image.save(save_path)

    return filename