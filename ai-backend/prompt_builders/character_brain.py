def build_character_brain(character):
    name = character.get('name', 'Unnamed')
    
    # Safe list unpacking or conversion for string representation
    core_traits = character.get('core_traits') or []
    strengths = character.get('strengths') or []
    flaws = character.get('flaws') or []
    fears = character.get('fears') or []
    goals = character.get('goals') or []
    values = character.get('values') or []
    
    attachment_style = character.get('attachment_style', '')
    communication_style = character.get('communication_style', '')
    voice_style = character.get('voice_style') or character.get('voice', '')

    return f"""
Name: {name}

Core Traits:
{core_traits}

Strengths:
{strengths}

Flaws:
{flaws}

Fears:
{fears}

Goals:
{goals}

Values:
{values}

Attachment Style:
{attachment_style}

Communication Style:
{communication_style}

Voice Style:
{voice_style}

Rules:
- Behave consistently.
- Fear influences decisions.
- Goals influence actions.
- Values influence choices.
- Flaws create realistic mistakes.
- Communication style affects dialogue.
"""
