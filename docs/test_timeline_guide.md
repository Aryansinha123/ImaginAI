# Guide: Testing Timeline Branching & Alternate Realities

Follow this step-by-step guide to test the newly implemented branching timeline, decision points, and alternate realities features in ImaginAI.

---

## 1. Setup Verification
Ensure both backend and frontend servers are running:
- **Backend**: Runs on `http://127.0.0.1:8000` via `uvicorn main:app --reload`
- **Frontend**: Runs on `http://localhost:3000` via `npm run dev`

---

## 2. Step-by-Step Testing Flow

### Step 1: Create characters and set up relations
1. Open the browser to `http://localhost:3000` and sign in.
2. Select or create a project universe.
3. Go to the **Characters** tab and create two characters:
   - **Character A**: `Ryan` (quiet and analytical)
   - **Character B**: `Aisha` (warm and expressive)
4. Go to the **Relationship Canvas** tab:
   - Double click the edge between Ryan and Aisha to set their base connection to "Friends".
   - Save the canvas state.

### Step 2: Write the Root Scene (Scene 1)
1. Navigate to the **Scene Studio** tab.
2. Fill out the editor form:
   - **Scene Title**: `Rainy Night at the Café`
   - **Branch From**: Keep as `None (Root Scene / Main)`
   - **Tone**: Select `emotional` or `tense`
   - **Bind Characters**: Select both `Ryan` and `Aisha`
   - **Narrative Beats**: `"Ryan and Aisha sit by the window. The rain is pouring down. Ryan fidgets with his coffee cup, wanting to tell Aisha how he feels, but holds back. They speak in hushed tones."`
3. Scroll down to **Add Narrative Decision Point**:
   - Check the checkbox to enable it.
   - **Decision Prompt Question**: `"What does Ryan choose to do?"`
   - **Choices**: 
     - Enter `"Confess"` and click **Add** (or press Enter).
     - Enter `"Stay Silent"` and click **Add**.
4. Click **Generate Cinematic Script** to run the completions pipeline.
5. Once loaded, read the script and note that the decision point question and choice buttons (`Confess +` and `Stay Silent +`) are rendered at the bottom of the script.

### Step 3: Branch Reality A ("Confess")
1. In the screenplay output panel, click the choice button **`Confess +`**.
2. Click **OK** on the alert dialog: `"No scene exists for the choice 'Confess'. Would you like to branch a new reality from here?"`
3. The Scene Studio editor form will automatically update:
   - **Branch From (Parent)** will pre-select `Scene 1: Rainy Night at the Café`
   - **Reality Label / Branch Name** will pre-fill as `Confess`
   - **Scene Title** will pre-fill as `Confess Reality`
   - **Narrative Beats** will pre-fill with a branched starter text.
4. Click **Generate Cinematic Script** to write the script for this reality.
5. Once generated, verify the dialogue reflects the confession. Note that the character relation changes updated in this branch represent "Reality A".

### Step 4: Branch Reality B ("Stay Silent")
1. Navigate back to **Scene 1** using the select dropdown at the top of the Scene Studio.
2. In the screenplay output panel under the script, click the second choice button **`Stay Silent +`**.
3. Confirm the branch creation.
4. The Scene Studio form will set the parent to `Scene 1` and the branch label to `Stay Silent`.
5. Click **Generate Cinematic Script** to write this script.
6. Verify this dialogue describes Ryan keeping his feelings hidden. This represents "Reality B".

---

## 3. Verifying Alternate Realities

### Verify the Timeline Tree Canvas
1. Go to the **Timeline** tab.
2. You will be greeted with the visual **Graph View** canvas:
   - Confirm `Scene 1` is displayed at the top.
   - Verify two branch paths split from `Scene 1` leading to `Scene 2 (Branch: Confess)` and `Scene 3 (Branch: Stay Silent)`.
   - Verify that clicking **Open Studio** on any node redirects you directly to that scene's workspace.
3. Click **List View** to toggle back to the sequential list if desired.

### Verify Emotional Isolation (Step 5)
1. Switch to the **Relationship Canvas** tab.
2. Verify that clicking/activating different scenes in the Scene Studio updates the Relationship Canvas dynamically:
   - Navigate to `Scene 2 (Confess)` in the Studio, then open the Relationship Canvas. The emotional edge between Ryan and Aisha will show branch-accumulated updates (e.g., higher attachment/trust).
   - Navigate to `Scene 3 (Stay Silent)` in the Studio, then open the Relationship Canvas. The emotional edge will show completely different, isolated values (e.g. higher awkwardness or resentment).
