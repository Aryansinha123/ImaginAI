from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from dotenv import load_dotenv
import os
from memory.memory_store import add_memory, get_memories
from vector_memory.memory_engine import store_memory, retrieve_memories

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
{scene}

========================
YOUR TASK & CRITICAL RULES
========================
Generate a deeply immersive, modern cinematic scene based on the current prompt.

1. CHARACTERS AND CONTINUITY
- NEVER introduce new characters automatically.
- Only reference the assigned characters above, existing memories, and existing relationship dynamics.
- Keep character personalities consistent based on their traits.

2. EMOTION AND SUBTEXT (SHOW, DON'T TELL)
- Show emotions through subtle expressions, actions, eye contact, body language, and pauses.
- Do NOT directly explain or over-narrate what a character is feeling.

3. MODERN, GROUNDED DIALOGUE
- Write human and natural dialogue: short realistic sentences, pauses, hesitation, awkward silence, and subtle tension.
- AVOID dramatic speeches, monologues, and overly poetic or Shakespearean writing.

4. CINEMATIC BUT SIMPLE NARRATION
- Enhance the environment cinematically (weather, lighting, sounds, atmosphere) but keep it simple and grounded.
- Example of GOOD narration: "Rain tapped softly against the windows."
- Example of BAD narration: "The heavens unleashed their sorrow upon the trembling earth."
- Keep the scene concise, realistic, and immersive.

========================
OUTPUT STYLE
========================
- Write like a modern Netflix emotional drama or indie film.
- NO fantasy writing, NO anime exposition, NO Shakespearean language, NO melodrama, NO fanfiction.
- Do NOT explain anything.
- Do NOT use bullet points.
- Only output the final immersive scene.
"""

    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "system",
                "content": system_prompt
            }
        ]
    )
    store_memory(
    project_id="default_project",
    scene_text=completion.choices[0].message.content
)
    add_memory(scene)

    return {
        "scene": completion.choices[0].message.content
    }