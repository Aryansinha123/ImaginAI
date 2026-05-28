from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from dotenv import load_dotenv
import os
from memory.memory_store import add_memory, get_memories
from vector_memory.memory_engine import store_memory, retrieve_memories
from data.emotions import (
    get_emotion_state,
    update_emotion_state
)
load_dotenv()

app = FastAPI()

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
def generate_scene(data: dict):
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
    edge_emotions = data.get("edge_emotions", None)
    
    edge_emotions_str = ""
    if edge_emotions:
        edge_emotions_str = f"Current Emotional State between characters:\n- Trust: {edge_emotions.get('trust')}%\n- Attachment: {edge_emotions.get('attachment')}%\n- Awkwardness: {edge_emotions.get('awkwardness')}%\n- Resentment: {edge_emotions.get('resentment')}%\n- Comfort: {edge_emotions.get('comfort')}%\n\n"

    characters_info = ""
    for idx, char in enumerate(characters):
        characters_info += f"""
========================
CHARACTER #{idx + 1}: {char.get('name', 'Unnamed')}
========================
Name: {char.get('name', 'Unnamed')}
Age: {char.get('age', 'N/A')}
Gender: {char.get('gender', 'N/A')}
Height: {char.get('height', 'N/A')}
Hair/Hairstyle: {char.get('hair', 'N/A')}
Eyes/Eye Color: {char.get('eyes', 'N/A')}
Skin Tone: {char.get('skinTone', 'N/A')}
Clothing Style: {char.get('clothing', 'N/A')}
Personality Traits: {char.get('personality', 'N/A')}
Emotional Traits: {char.get('emotionalTraits', 'N/A')}
Speaking Style: {char.get('speakingStyle', 'N/A')}
Relationship Type: {char.get('relationship', 'N/A')}
Voice Style: {char.get('voice', 'N/A')}
"""

    system_prompt = f"""
You are EchoVerse, a modern, cinematic storytelling AI.
Your purpose is to generate highly realistic, emotionally grounded, and immersive scenes that feel like a premium Netflix drama or indie film.

========================
ASSIGNED CHARACTERS (CRITICAL)
========================
You must ONLY use the characters listed below. NEVER introduce new characters automatically.

{characters_info}

========================
SCENE PARAMETERS
========================
Target Emotional Tone: {tone}

========================
MEMORY & PAST EVENTS
========================
{past_memories}

========================
CURRENT SCENE PROMPT
========================
{edge_emotions_str}{scene}

========================
YOUR TASK & CRITICAL RULES
========================
1. Write the scene natively using the tone: '{tone}'.
2. The scene must ONLY involve the assigned characters listed above. NEVER introduce new characters.
3. The writing must be modern, grounded, cinematic, emotionally realistic, subtle, and immersive (like a Netflix emotional drama or indie film).
4. Dialogue should feel human and natural (use short realistic sentences, pauses, realistic reactions).
5. DO NOT use fantasy writing, Shakespearean prose, fanfiction tropes, exaggerated poetry, melodrama, or anime exposition.
6. Enhance the environment cinematically (weather, lighting, sounds, atmosphere) but keep it simple and grounded.

**OUTPUT FORMAT:**
You must return your response as a valid JSON object with EXACTLY two keys:
1. "scene": The full text of the generated scene.
2. "updated_emotions": A JSON object containing updated 0-100 values for trust, attachment, awkwardness, resentment, and comfort after evaluating how the interaction affected their relationship. If there is no relationship edge, just return an empty object.

Example JSON:
{{
  "scene": "The text of the scene goes here...",
  "updated_emotions": {{
    "trust": 55,
    "attachment": 50,
    "awkwardness": 10,
    "resentment": 5,
    "comfort": 45
  }}
}}
"""

    import json
    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "system",
                "content": system_prompt
            }
        ],
        response_format={"type": "json_object"}
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
        response_data = {"scene": response_text, "updated_emotions": None}
        
    generated_scene = response_data.get("scene", response_text)
    updated_emotions = response_data.get("updated_emotions", None)

    store_memory(
        project_id="default_project",
        scene_text=generated_scene
    )
    add_memory(scene)

    return {
        "scene": generated_scene,
        "updated_emotions": updated_emotions
    }