import os
import json

character_arcs = {}

DATA_FILE = os.path.join(os.path.dirname(__file__), "character_arcs.json")

def load_character_arcs():
    global character_arcs
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                character_arcs = json.load(f)
        except Exception as e:
            print(f"Error loading character arcs: {e}")
            character_arcs = {}
    else:
        character_arcs = {}
    return character_arcs

def save_character_arcs():
    try:
        os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(character_arcs, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error saving character arcs: {e}")

def get_character_arc(character_name, project_id="default_project"):
    load_character_arcs()
    if project_id not in character_arcs:
        character_arcs[project_id] = {}
        
    if character_name not in character_arcs[project_id]:
        character_arcs[project_id][character_name] = {
            "starting_state": "Emotionally guarded",
            "current_state": "Emotionally guarded",
            "growth_direction": "Becoming emotionally open",
            "current_conflict": "Fear of abandonment",
            "arc_stage": "beginning",
            "arc_progress": 0,
            "history": []
        }
        save_character_arcs()
        
    return character_arcs[project_id][character_name]

def update_character_arc(character_name, state_update, scene_title=None, scene_number=1, project_id="default_project"):
    load_character_arcs()
    
    # Ensure nested dictionary structure exists
    if project_id not in character_arcs:
        character_arcs[project_id] = {}
        
    arc = get_character_arc(character_name, project_id=project_id)
    arc["starting_state"] = state_update.get("starting_state", arc.get("starting_state", "Emotionally guarded"))
    arc["current_state"] = state_update.get("current_state", arc["current_state"])
    arc["growth_direction"] = state_update.get("growth_direction", arc["growth_direction"])
    arc["current_conflict"] = state_update.get("current_conflict", arc["current_conflict"])
    arc["arc_stage"] = state_update.get("arc_stage", arc["arc_stage"])
    arc["arc_progress"] = state_update.get("arc_progress", arc["arc_progress"])
    
    # Append to history
    arc["history"].append({
        "scene": scene_number,
        "title": scene_title or f"Scene {scene_number}",
        "progress": arc["arc_progress"],
        "state": arc["current_state"]
    })
    
    # Update local structure and save
    character_arcs[project_id][character_name] = arc
    save_character_arcs()
