from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from groq import Groq
from dotenv import load_dotenv
import os
from memory.memory_store import add_memory, get_memories
from vector_memory.memory_engine import store_memory, retrieve_memories
from data.relationships import (
    get_relationship_state,
    update_relationship_state
)
from vector_memory.memory_extractor import (
    extract_memory
)
from director_engine import generate_direction
from image_generator import generate_scene_image

from visual_prompt_engine import (
    build_visual_prompt
)
from prompt_builders.character_brain import build_character_brain
from character_engine.thought_engine import get_character_hidden_thoughts
from data.emotions import get_emotion_state
from pydantic import BaseModel
from typing import List, Dict, Optional, Any

class SceneRequest(BaseModel):
    scene: str
    characters: Optional[List[Dict[str, Any]]] = []
    character: Optional[Dict[str, Any]] = None
    tone: Optional[str] = "neutral"
    past_memories: Optional[str] = None
    relationships: Optional[Dict[str, Any]] = {}

load_dotenv()

app = FastAPI()

# Ensure generated_images directory exists
os.makedirs("generated_images", exist_ok=True)

# Mount the static directory for generated images
app.mount(
    "/generated_images",
    StaticFiles(directory="generated_images"),
    name="generated_images"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

@app.get("/")
def home():
    return {
        "message": "EchoVerse AI Backend Running"
    }

@app.post("/chat")
def chat(prompt: str):

    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    return {
        "response": completion.choices[0].message.content
    }

@app.post("/generate-scene")
def generate_scene(request_data: SceneRequest):
    data = request_data.dict()
    characters = data.get("characters", [])
    if not characters and data.get("character"):
        characters = [data.get("character")]
        
    scene = data.get("scene", "")
    tone = data.get("tone", "neutral")
    
    # Read past memories sent from Next.js (isolated db memory), fallback to local memory_store
    past_memories = data.get("past_memories")
    if not past_memories:
        past_memories = retrieve_memories(
            project_id="default_project",
            current_scene=scene
        )
    
    # Truncate past_memories to prevent exceeding Groq TPM (tokens per minute) limit
    if past_memories and len(past_memories) > 2000:
        past_memories = past_memories[:2000] + "\n... [Truncated for brevity to fit rate limits]"
    
    # Build/fetch directional relationships between all pairs of characters in the scene
    relationships = data.get("relationships", {})
    if not relationships and len(characters) > 1:
        relationships = {}
        for i in range(len(characters)):
            for j in range(len(characters)):
                if i != j:
                    c1 = characters[i].get("name")
                    c2 = characters[j].get("name")
                    if c1 and c2:
                        relationships[f"{c1}->{c2}"] = get_relationship_state(c1, c2)
 
    relationships_str = ""
    if relationships:
        relationships_str = "Current Relationship Dynamics (directional emotions):\n"
        for key, ems in relationships.items():
            relationships_str += f"- {key} (how the first character feels towards the second): Trust: {ems.get('trust')}%, Attachment: {ems.get('attachment')}%, Awkwardness: {ems.get('awkwardness')}%, Resentment: {ems.get('resentment')}%, Comfort: {ems.get('comfort')}%\n"
        relationships_str += "\n"

    character_brains_list = []
    hidden_thoughts_dict = {}
    hidden_thoughts_prompt_list = []

    for char in characters:
        char_name = char.get("name", "Unnamed")
        brain_str = build_character_brain(char)
        character_brains_list.append(brain_str)
        
        # Build emotional state for the character
        indiv_emotions = get_emotion_state(char_name)
        char_relationships = {}
        for other_char in characters:
            other_name = other_char.get("name")
            if other_name and other_name != char_name:
                char_relationships[f"{char_name}->{other_name}"] = get_relationship_state(char_name, other_name)
        
        emotional_state_str = f"Individual Emotions: {indiv_emotions}\n"
        if char_relationships:
            emotional_state_str += "Relationship Dynamics with other characters in the scene:\n"
            for key, val in char_relationships.items():
                emotional_state_str += f"- {key}: {val}\n"
        
        # Generate hidden thoughts for this character
        thoughts = get_character_hidden_thoughts(
            client=client,
            character_name=char_name,
            character_brain=brain_str,
            emotional_state=emotional_state_str,
            memories=past_memories,
            scene=scene
        )
        hidden_thoughts_dict[char_name] = thoughts
        
        # Format the thoughts for prompt injection
        hidden_thoughts_prompt_list.append(
            f"Character: {char_name}\n"
            f"- Hidden Thoughts: \"{thoughts.get('hidden_thoughts', '')}\"\n"
            f"- Motivation: {thoughts.get('motivation', '')}\n"
            f"- Secret Feeling: {thoughts.get('secret_feeling', '')}"
        )

    character_brain_str = "\n".join(character_brains_list)
    hidden_thoughts_prompt_str = "\n\n".join(hidden_thoughts_prompt_list)

    system_prompt = f"""
You are EchoVerse, a modern, cinematic storytelling AI.
Your purpose is to generate highly realistic, emotionally grounded, and immersive scenes that feel like a premium Netflix drama or indie film.

========================
ASSIGNED CHARACTERS (CRITICAL)
========================
You must ONLY use the characters listed below. NEVER introduce new characters automatically.

Assigned Character Brain:

{character_brain_str}

========================
CHARACTERS' HIDDEN THOUGHTS (INTERNAL STATES FOR THIS SCENE)
========================
These are the private internal thoughts, motivations, and secret feelings of the characters at the start of this scene. 
Use them to guide each character's dialogue subtext, pauses, micro-expressions, and actions. 
CRITICAL: Do NOT print these hidden thoughts verbatim in the screenplay text. They are private internal states and should influence their subtext and behavioral tension without being spoken directly.

{hidden_thoughts_prompt_str}

========================
SCENE PARAMETERS
========================
Target Emotional Tone: {tone}

========================
CURRENT DIRECTIONAL RELATIONSHIP DYNAMICS
========================
{relationships_str}

========================
MEMORY & PAST EVENTS
========================
{past_memories}

========================
CURRENT SCENE PROMPT
========================
{scene}

========================
YOUR TASK & CRITICAL RULES
========================
1. Write the scene natively using the tone: '{tone}'.
2. The scene must ONLY involve the assigned characters listed above. NEVER introduce new characters.
3. The writing must be modern, grounded, cinematic, emotionally realistic, subtle, and immersive (like a Netflix emotional drama or indie film).
4. Dialogue should feel human and natural (use short realistic sentences, pauses, realistic reactions).
5. DO NOT use fantasy writing, Shakespearean prose, fanfiction tropes, exaggerated poetry, melodrama, or anime exposition.
6. Enhance the environment cinematically (weather, lighting, sounds, atmosphere) but keep it simple and grounded.
7. REALISTIC EMOTIONAL LIFELIKE SHIFTS (CRITICAL):
   - Real-world relationship dynamics change slowly, subtly, and unevenly.
   - Do NOT make massive jumps in scores (e.g., trust going from 50% to 80% in one brief talk is highly unrealistic). Keep typical shifts incremental (usually 1% to 8% max per scene).
   - Reflect complex, non-ideal human psychology:
     - Characters can get closer (attachment increases) but simultaneously feel more vulnerable or awkward (awkwardness might also increase).
     - Emotion updates must be asymmetric. If character A feels a surge of trust or attachment, character B might remain guarded, feel pressured, or even feel increased resentment. 
     - Do not mirror emotions perfectly between the characters. Each direction of the relationship key must be updated independently based on how that specific character perceived the interaction.
8. Before generating dialogue, consider:
   1. What does this character WANT?
   2. What does this character FEAR?
   3. What emotional state are they in?
   4. What memories affect this scene?
   5. What would this specific character realistically say?

**OUTPUT FORMAT:**
You must return your response as a valid JSON object with EXACTLY two keys:
1. "scene": The full text of the generated scene.
2. "updated_emotions": A JSON object containing updated 0-100 values for trust, attachment, awkwardness, resentment, and comfort for each directional relationship affected by this scene. Use the format "CharacterA_Name->CharacterB_Name" as the keys. Only include pair directions that are actually affected or actively interact in the scene.

Example JSON:
{{
  "scene": "The text of the scene goes here...",
  "updated_emotions": {{
    "Elena->Aisha": {{
      "trust": 55,
      "attachment": 50,
      "awkwardness": 10,
      "resentment": 5,
      "comfort": 45
    }},
    "Aisha->Elena": {{
      "trust": 48,
      "attachment": 52,
      "awkwardness": 12,
      "resentment": 6,
      "comfort": 40
    }}
  }}
}}
"""

    import json
    
    messages = [
        {
            "role": "system",
            "content": system_prompt
        },
        {
            "role": "user",
            "content": f"Generate the scene screenplay based on the prompt: '{scene}'. Respond with a JSON object containing the 'scene' and 'updated_emotions' keys."
        }
    ]

    # Try JSON mode first, fall back to plain text if Groq rejects it
    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            response_format={"type": "json_object"},
            max_tokens=1500
        )
        response_text = completion.choices[0].message.content
    except Exception as json_err:
        print(f"JSON mode failed, retrying without JSON mode: {json_err}")
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            max_tokens=1500
        )
        response_text = completion.choices[0].message.content
    
    cleaned_text = response_text.strip()
    if cleaned_text.startswith("```json"):
        cleaned_text = cleaned_text[7:]
    elif cleaned_text.startswith("```"):
        cleaned_text = cleaned_text[3:]
    if cleaned_text.endswith("```"):
        cleaned_text = cleaned_text[:-3]
    cleaned_text = cleaned_text.strip()

    try:
        response_data = json.loads(cleaned_text)
    except Exception:
        response_data = None

    # Handle cases where Groq returns a list, string, or malformed data
    if isinstance(response_data, dict):
        generated_scene = response_data.get("scene", response_text)
        updated_emotions = response_data.get("updated_emotions", None)
    elif isinstance(response_data, list) and len(response_data) > 0 and isinstance(response_data[0], dict):
        generated_scene = response_data[0].get("scene", response_text)
        updated_emotions = response_data[0].get("updated_emotions", None)
    else:
        generated_scene = response_text
        updated_emotions = None

    # --- Memory extraction (non-blocking) ---
    try:
        memory_data = extract_memory(generated_scene)
        print("\n" + "="*50)
        print("EXTRACTED EMOTIONAL MEMORY OBJECT:")
        print(json.dumps(memory_data, indent=2))
        print("="*50 + "\n")
        store_memory(
            project_id="default_project",
            memory_data=memory_data
        )
        add_memory(scene)
    except Exception as e:
        print(f"Error in memory extraction/storage: {e}")

    # --- Relationship updates (non-blocking) ---
    try:
        if updated_emotions and isinstance(updated_emotions, dict):
            for key, ems in updated_emotions.items():
                parts = key.split("->")
                if len(parts) == 2:
                    c1, c2 = parts[0].strip(), parts[1].strip()
                    curr = get_relationship_state(c1, c2)
                    deltas = {}
                    for k, v in ems.items():
                        if k in curr:
                            deltas[k] = v - curr[k]
                    update_relationship_state(c1, c2, deltas)
    except Exception as e:
        print(f"Error updating relationships: {e}")

    # --- Director engine (non-blocking) ---
    direction_data = None
    try:
        direction_data = generate_direction(generated_scene)
    except Exception as e:
        print(f"Error generating direction: {e}")

    # --- Image generation (non-blocking) ---
    image_filenames = []
    try:
        if direction_data and characters:
            for i in range(3):
                try:
                    visual_prompt = build_visual_prompt(
                        generated_scene,
                        direction_data,
                        characters,
                        frame_index=i
                    )
                    img_file = generate_scene_image(visual_prompt)
                    if img_file:
                        image_filenames.append(img_file)
                except Exception as img_err:
                    print(f"Error generating image {i+1}: {img_err}")
    except Exception as e:
        print(f"Error in image generation block: {e}")

    return {
        "scene": generated_scene,
        "updated_emotions": updated_emotions,
        "direction": direction_data,
        "image": image_filenames[0] if image_filenames else None,
        "images": image_filenames,
        "hidden_thoughts": hidden_thoughts_dict
    }

@app.delete("/generated_images/{filename}")
def delete_image(filename: str):
    file_path = os.path.join("generated_images", filename)
    # Basic security check to prevent path traversal
    if ".." in filename or filename.startswith("/") or filename.startswith("\\"):
        return {"status": "error", "message": "Invalid filename"}
    
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            return {"status": "success", "message": f"Deleted {filename}"}
        except Exception as e:
            return {"status": "error", "message": f"Failed to delete file: {str(e)}"}
    return {"status": "error", "message": "File not found"}