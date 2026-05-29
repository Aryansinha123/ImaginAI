def build_visual_prompt(
    scene,
    direction,
    characters,
    frame_index=0
):

    character_descriptions = []

    for char in characters:
        appearance = char.get('appearance') or {}
        if not isinstance(appearance, dict):
            appearance = {}

        hair = appearance.get('hair') or char.get('hair') or ""
        clothing = appearance.get('clothing') or char.get('clothing') or ""
        eyes = appearance.get('eyes') or char.get('eyes') or ""

        desc = f"""
        {char.get('name', 'Unnamed')},
        {hair},
        {clothing},
        {eyes}
        """

        character_descriptions.append(desc)

    joined_characters = ", ".join(
        character_descriptions
    )

    # Customize visual details to create three distinct moments / compositions
    if frame_index == 0:
        framing = "Wide establishing shot, cinematic environmental composition, showing the full setting and character placement"
        focus = "Focusing on the beginning of the scene and the physical space"
    elif frame_index == 1:
        framing = "Medium shot, chest-up composition, focusing on character interaction, expressions, and posture"
        focus = "Focusing on the conversational peak in the middle of the scene"
    else:
        framing = "Close-up cinematic shot, highly focused, highlighting facial detail, micro-expressions, and deep emotion"
        focus = "Focusing on the emotional reaction, climax, or quiet closing moment of the scene"

    prompt = f"""
    Cinematic movie still,
    {framing},
    {direction.get('mood', 'neutral') if direction else 'neutral'},
    {direction.get('lighting', 'soft') if direction else 'soft'},
    {direction.get('weather', 'clear') if direction else 'clear'},
    {direction.get('camera', 'digital film camera') if direction else 'digital film camera'},
    {direction.get('color_palette', 'natural colors') if direction else 'natural colors'},

    Characters:
    {joined_characters}

    Moment Details:
    {focus}

    Scene Context:
    {scene}

    Film grain,
    Emotional atmosphere,
    Photorealistic cinematic lighting,
    Netflix drama aesthetic,
    Detailed background,
    Frame {frame_index + 1} of 3
    """

    return prompt