emotion_states = {}

def get_emotion_state(character_name):

    if character_name not in emotion_states:

        emotion_states[character_name] = {
            "trust": 50,
            "attachment": 50,
            "awkwardness": 0,
            "resentment": 0,
            "comfort": 50
        }

    return emotion_states[character_name]

def update_emotion_state(character_name, updates):

    state = get_emotion_state(character_name)

    for key, value in updates.items():

        if key in state:
            state[key] += value

            state[key] = max(0, min(100, state[key]))