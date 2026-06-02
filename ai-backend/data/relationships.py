import os
import json

relationship_states = {}

DATA_FILE = os.path.join(os.path.dirname(__file__), "relationships.json")

def load_relationships():
    global relationship_states
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                relationship_states = json.load(f)
        except Exception as e:
            print(f"Error loading relationships: {e}")
            relationship_states = {}
    else:
        relationship_states = {}
    return relationship_states

def save_relationships():
    try:
        os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(relationship_states, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error saving relationships: {e}")

def relationship_key(char1, char2):
    return f"{char1}->{char2}"

def get_relationship_state(char1, char2, project_id="default_project"):
    load_relationships()
    if project_id not in relationship_states:
        relationship_states[project_id] = {}
        
    key = relationship_key(char1, char2)
    if key not in relationship_states[project_id]:
        relationship_states[project_id][key] = {
            "trust": 50,
            "attachment": 50,
            "awkwardness": 0,
            "resentment": 0,
            "comfort": 50
        }
        save_relationships()
        
    return relationship_states[project_id][key]

def update_relationship_state(char1, char2, updates, project_id="default_project"):
    load_relationships()
    
    # Ensure nested dictionary structure exists
    if project_id not in relationship_states:
        relationship_states[project_id] = {}
        
    state = get_relationship_state(char1, char2, project_id=project_id)
    key = relationship_key(char1, char2)
    
    for key_em, value in updates.items():
        if key_em in state:
            state[key_em] += value
            state[key_em] = max(0, min(100, state[key_em]))
            
    relationship_states[project_id][key] = state
    save_relationships()