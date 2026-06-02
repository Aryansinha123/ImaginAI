import os
import json

emotion_states = {}

DATA_FILE = os.path.join(os.path.dirname(__file__), "emotions.json")

def load_emotions():
    global emotion_states
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                emotion_states = json.load(f)
        except Exception as e:
            print(f"Error loading emotions: {e}")
            emotion_states = {}
    else:
        emotion_states = {}
    return emotion_states

def save_emotions():
    try:
        os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(emotion_states, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error saving emotions: {e}")

def get_emotion_state(character_name, project_id="default_project"):
    load_emotions()
    if project_id not in emotion_states:
        emotion_states[project_id] = {}
        
    if character_name not in emotion_states[project_id]:
        emotion_states[project_id][character_name] = {
            "trust": 50,
            "attachment": 50,
            "awkwardness": 0,
            "resentment": 0,
            "comfort": 50
        }
        save_emotions()
        
    return emotion_states[project_id][character_name]

def update_emotion_state(character_name, updates, project_id="default_project"):
    load_emotions()
    
    # Ensure nested dictionary structure exists
    if project_id not in emotion_states:
        emotion_states[project_id] = {}
        
    state = get_emotion_state(character_name, project_id=project_id)
    
    for key, value in updates.items():
        if key in state:
            state[key] += value
            state[key] = max(0, min(100, state[key]))
            
    emotion_states[project_id][character_name] = state
    save_emotions()