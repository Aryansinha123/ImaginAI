def build_visual_prompt(
    scene,
    direction,
    characters
):

    character_descriptions = []

    for char in characters:

        desc = f"""
        {char['name']},
        {char['hair']},
        {char['clothing']},
        {char['eyes']}
        """

        character_descriptions.append(desc)

    joined_characters = ", ".join(
        character_descriptions
    )

    prompt = f"""
    cinematic movie still,
    {direction['mood']},
    {direction['lighting']},
    {direction['weather']},
    {direction['camera']},
    {direction['color_palette']},

    Characters:
    {joined_characters}

    Scene:
    {scene}

    ultra cinematic,
    emotional atmosphere,
    realistic lighting,
    film still,
    detailed composition
    """

    return prompt