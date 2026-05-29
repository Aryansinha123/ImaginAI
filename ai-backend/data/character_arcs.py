character_arcs = {}

def get_character_arc(character_name):
    if character_name not in character_arcs:
        character_arcs[character_name] = {
            "starting_state": "Emotionally guarded",
            "current_state": "Emotionally guarded",
            "growth_direction": "Becoming emotionally open",
            "current_conflict": "Fear of abandonment",
            "arc_stage": "beginning",
            "arc_progress": 0,
            "history": []
        }
    return character_arcs[character_name]

def update_character_arc(character_name, state_update, scene_title=None, scene_number=1):
    arc = get_character_arc(character_name)
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
