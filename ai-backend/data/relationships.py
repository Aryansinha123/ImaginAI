relationship_states = {}

def relationship_key(char1, char2):

    return f"{char1}->{char2}"

def get_relationship_state(char1, char2):

    key = relationship_key(char1, char2)

    if key not in relationship_states:

        relationship_states[key] = {
            "trust": 50,
            "attachment": 50,
            "awkwardness": 0,
            "resentment": 0,
            "comfort": 50
        }

    return relationship_states[key]

def update_relationship_state(char1, char2, updates):

    state = get_relationship_state(char1, char2)

    for key, value in updates.items():

        if key in state:

            state[key] += value

            state[key] = max(0, min(100, state[key]))