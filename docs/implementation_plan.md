# Implementation Plan - Phase 1: Character Brain System

This plan outlines the changes required to transform the simplistic character definition (flat attributes and simple personality string) into a deep, multi-dimensional character brain model containing core traits, strengths, flaws, fears, goals, values, attachment style, communication style, and voice style.

---

## User Review Required

> [!IMPORTANT]
> - **Legacy Data Compatibility**: Existing character records in the database will be automatically parsed to fit the new nested schema and display default values (or map older fields like `personality` into `core_traits` list) so that legacy data does not break the application.
> - **LLM Guidance & Generation Quality**: In Step 5, we add direct cognitive prompts instructing the LLM to consider character wants, fears, emotional states, and memories before writing dialogue. This improves the scene generation output quality.

---

## Open Questions

> [!NOTE]
> There are no outstanding open questions, as the specifications for character schema, form fields, and prompt templates are clearly defined in the requirements.

---

## Proposed Changes

### Backend Components

#### [NEW] [character_brain.py](file:///c:/Users/hp/CODEBASE/Projects/ImaginAI/ai-backend/prompt_builders/character_brain.py)
Create a new prompt builder module that compiles character traits, strengths, flaws, fears, goals, values, attachment style, communication style, and voice style into a structured text prompt block.

#### [MODIFY] [main.py](file:///c:/Users/hp/CODEBASE/Projects/ImaginAI/ai-backend/main.py)
- Import `build_character_brain` from `prompt_builders.character_brain`.
- In `/generate-scene`, replace the legacy flat personality/character description generation with the concatenated character brain prompt blocks of all characters in the scene.
- Update the system prompt to instruct the LLM to consider the character wants, fears, emotional state, memories, and communication styles before generating dialogue.

#### [MODIFY] [visual_prompt_engine.py](file:///c:/Users/hp/CODEBASE/Projects/ImaginAI/ai-backend/visual_prompt_engine.py)
- Adjust character appearance retrieval to safely read from the nested `appearance` object or fallback to legacy flat keys (`hair`, `clothing`, `eyes`).

---

### Frontend Components & APIs

#### [MODIFY] [route.js](file:///c:/Users/hp/CODEBASE/Projects/ImaginAI/frontend/app/api/projects/%5BprojectId%5D/characters/route.js)
- Upgrade `GET` to map database records into the new nested schema, filling defaults for missing lists or mapping old fields.
- Upgrade `POST` to accept and write the nested schema structure.

#### [MODIFY] [route.js](file:///c:/Users/hp/CODEBASE/Projects/ImaginAI/frontend/app/api/projects/%5BprojectId%5D/characters/%5BcharacterId%5D/route.js)
- Update `PATCH` allowed fields to accept the upgraded schema (nested `appearance`, arrays for traits/strengths/flaws/fears/goals/values, and string fields like `attachment_style` and `communication_style`).

#### [MODIFY] [CharactersView.js](file:///c:/Users/hp/CODEBASE/Projects/ImaginAI/frontend/components/CharactersView.js)
- Update local form state to manage the new schema fields:
  - Add tag-based list input fields for: **Core Traits**, **Strengths**, **Flaws**, **Fears**, **Goals**, and **Values** (supporting adding/removing items as pills/badges).
  - Add a dropdown selector for **Attachment Style** (`Secure`, `Anxious`, `Avoidant`, `Fearful Avoidant`).
  - Add input field for **Communication Style**.
  - Map old properties into their new counterparts when editing an existing character.
- Render the **Character Brain Preview UI** on character cards to show traits, strengths, flaws, fear, goal, and attachment style with the checkmark styling as specified.

#### [MODIFY] [CharacterForm.js](file:///c:/Users/hp/CODEBASE/Projects/ImaginAI/frontend/components/CharacterForm.js)
- Update this standalone component to match the same form schema structure (using nested appearance and list fields for core traits, strengths, flaws, fears, goals, values, attachment style dropdown, communication style, etc.) for code consistency.

---

## Verification Plan

### Automated/Manual Verification
- Run the FastAPI backend server (`python -m uvicorn main:app --reload` or similar).
- Run the Next.js dev server (`npm run dev`).
- Open the application and visit the **Characters** section.
- Create a new character (e.g., Aisha) with the new fields:
  - Core Traits: `introverted`, `empathetic`, `observant`
  - Strengths: `loyal`, `patient`
  - Flaws: `overthinks`, `avoids confrontation`
  - Fears: `abandonment`
  - Goals: `build meaningful relationships`
  - Values: `honesty`, `loyalty`
  - Attachment Style: `Avoidant`
  - Communication Style: `soft and indirect`
- Verify that the card displays the checkmarks (`✓`) next to the brain properties.
- Edit the character, verify that the inputs are populated correctly.
- Go to the **Scene Studio**, generate a new scene featuring the character.
- Verify that the prompt sent to Groq includes the structured character brain block and that the generated dialogue adheres to the new cognitive prompt instructions.
