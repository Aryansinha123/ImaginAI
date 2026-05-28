# ImaginAI Progress Summary

ImaginAI is an emotionally intelligent cinematic storytelling web application. It combines a Next.js frontend (with user authentication, project dashboard, character management, and scene sequencing) and a Python FastAPI backend that interfaces with LLMs to generate immersive cinematic scenes based on character profiles, narrative tone, and memories of past events.

---

## Technical Stack

### Next.js Frontend
- **Framework**: Next.js 16.2.6 (App Router, Turbopack) & React 19.
- **Styling**: Tailwind CSS for custom dark glassmorphic components.
- **Animation**: Framer Motion for smooth transitions and hover micro-animations.
- **Icons**: Lucide React.
- **State Management**: Zustand for global state sync (auth, projects, active views, characters, and scenes).
- **HTTP Client**: Axios with interceptors for attaching JWT auth headers.
- **Database**: MongoDB Atlas via the official Node MongoDB driver.

### FastAPI Backend
- **Core**: FastAPI (Python 3.11) served using Uvicorn.
- **AI Integration**: Groq SDK for accessing `llama-3.1-8b-instant`.
- **Configuration**: `python-dotenv` for local environment management.
- **Context Storage**: In-memory array (structured to upgrade to ChromaDB vector database).

---

## Implemented Features

1. **User Authentication**: Secure registration and login. Passwords are encrypted using `bcryptjs` and sessions are verified using JSON Web Tokens (JWT).
2. **Project Workspace**: Multi-project tracking (CRUD) with options to create, rename, and delete workspace sessions.
3. **Character Directory**: Character sheets defining name, age, appearance (hair, eyes, skin, clothing), personality, speech styles, and relationships.
4. **Cinematic Scene Studio**: Visual prompt laboratory. Users choose character sheets, configure emotional tones (e.g. dramatic, romantic, tense), write prompts, and trigger AI generation.
5. **Timeline Sequencing**: Visual drag-and-drop and index-based ordering of cinematic chapters/scenes.
6. **Emotional Memory Engine**: Generated scenes are stored in the backend memory store. When future scenes are generated, the prompt incorporates character context and past stories to maintain continuity and emotional consequences.

---

## Key Files and Directory Structure

### 1. Python Backend (`ai-backend/`)
- **[main.py](file:///c:/Users/hp/CODEBASE/Projects/ImaginAI/ai-backend/main.py)**: Houses FastAPI entry points. Integrates character profiles and memory store history into a structured prompt, then invokes the Groq client.
- **[memory_store.py](file:///c:/Users/hp/CODEBASE/Projects/ImaginAI/ai-backend/memory/memory_store.py)**: Simple memory storage handling list functions `add_memory` and `get_memories`.

### 2. Next.js Frontend Config & Utilities (`frontend/`)
- **[useStore.js](file:///c:/Users/hp/CODEBASE/Projects/ImaginAI/frontend/store/useStore.js)**: State controller managing asynchronous actions (authentication, CRUD operations, ordering updates, and state syncing).
- **[api.js](file:///c:/Users/hp/CODEBASE/Projects/ImaginAI/frontend/lib/api.js)**: Axios configuration mapping default headers and the `/api` prefix.
- **[mongodb.js](file:///c:/Users/hp/CODEBASE/Projects/ImaginAI/frontend/lib/mongodb.js)**: Singleton utility ensuring a cached MongoDB connection during development.

### 3. Frontend API Route Handlers (`frontend/app/api/`)
- **[login/route.js](file:///c:/Users/hp/CODEBASE/Projects/ImaginAI/frontend/app/api/login/route.js)** & **[register/route.js](file:///c:/Users/hp/CODEBASE/Projects/ImaginAI/frontend/app/api/register/route.js)**: Handle authentication operations.
- **[projects/route.js](file:///c:/Users/hp/CODEBASE/Projects/ImaginAI/frontend/app/api/projects/route.js)**: Fetches all projects belonging to the logged-in user and handles new project inserts.
- **[projects/\[projectId\]/characters/route.js](file:///c:/Users/hp/CODEBASE/Projects/ImaginAI/frontend/app/api/projects/%5BprojectId%5D/characters/route.js)**: Fetches and appends character models to the selected project.
- **[projects/\[projectId\]/scenes/route.js](file:///c:/Users/hp/CODEBASE/Projects/ImaginAI/frontend/app/api/projects/%5BprojectId%5D/scenes/route.js)**: Coordinates MongoDB storage of scene models and makes HTTP calls to the Python backend on `http://127.0.0.1:8000/generate-scene` for LLM orchestration.

### 4. Frontend UI Components (`frontend/components/`)
- **[Sidebar.js](file:///c:/Users/hp/CODEBASE/Projects/ImaginAI/frontend/components/Sidebar.js)**: Navigation panel showing project settings, authentication states, and view selectors.
- **[SceneStudioView.js](file:///c:/Users/hp/CODEBASE/Projects/ImaginAI/frontend/components/SceneStudioView.js)**: Main editor area allowing custom scene prompts, character selection, tone setting, and rendering of the generated narration.
- **[TimelineView.js](file:///c:/Users/hp/CODEBASE/Projects/ImaginAI/frontend/components/TimelineView.js)**: Arranges generated scenes in chronological sequence.
- **[CharactersView.js](file:///c:/Users/hp/CODEBASE/Projects/ImaginAI/frontend/components/CharactersView.js)**: Displays character sheets and renders forms to add/modify character details.
- **[MemoriesView.js](file:///c:/Users/hp/CODEBASE/Projects/ImaginAI/frontend/components/MemoriesView.js)**: Displays narrative memories stored in the project database.
