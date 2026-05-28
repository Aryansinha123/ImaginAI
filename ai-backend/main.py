from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

    if updated_emotions:
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

    return {
        "scene": generated_scene,
        "updated_emotions": updated_emotions
    }