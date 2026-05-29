# EchoVerse End-to-End System Demo & Testing Guide

This document outlines the step-by-step walkthrough to test and demonstrate all features of **EchoVerse (ImaginAI)**. Follow these steps to verify character creation, relationship webs, interactive canvas, scene generation, director commands, dynamic memory, character arcs, and image pipelines.

---

## 1. Setup & Starting a Universe

1. Open your browser and navigate to the local environment (usually `http://localhost:3000`).
2. Log in using your writer credentials or sign up.
3. Click the **Active Universe** folder selector in the sidebar.
4. Click the `+` icon and type a name for your new story universe (e.g., `"Cyberpunk Syndicate"`) and press **Enter** to create and auto-select it.

---

## 2. Character Creation & Psychologies

Navigate to the **Characters** workspace tab:
1. Click **Add Character** to open the Configuration Drawer.
2. Create **Character A**:
   - **Name**: `Aisha Mitchell`
   - **Age**: `25`
   - **Gender**: `Female`
   - **Appearance**: `5ft 6in`, `Olive skin`, `Curly dark brown hair`, `Amber eyes`, `Casual oversized black hoodie`
   - **Core Traits**: `Resilient`, `Analytical`, `Guarded`
   - **Strengths**: `Detail-oriented`, `Loyal`
   - **Flaws**: `Distrustful`, `Secretive`
   - **Fears**: `Betrayal`, `Abandonment`
   - **Goals**: `Expose the megacorp`, `Find her missing brother`
   - **Values**: `Independence`, `Truth`
   - **Attachment Style**: `Avoidant`
   - **Voice Style**: `Calm and soft-spoken`
   - Click **Save Profile**.
3. Create **Character B**:
   - **Name**: `Ryan Vance`
   - **Age**: `27`
   - **Gender**: `Male`
   - **Appearance**: `6ft 0in`, `Fair skin`, `Messy blonde hair`, `Blue eyes`, `Tech-wear bomber jacket`
   - **Core Traits**: `Empathetic`, `Impulsive`, `Charismatic`
   - **Strengths**: `Hacking`, `Quick-thinking`
   - **Flaws**: `Overly trusting`, `Reckless`
   - **Fears**: `Failure`, `Losing people he cares about`
   - **Goals**: `Dismantle the firewall`, `Keep Aisha safe`
   - **Values**: `Connection`, `Justice`
   - **Attachment Style**: `Anxious`
   - **Voice Style**: `Fast-paced and energetic`
   - Click **Save Profile**.

---

## 3. Designing the Relationship Canvas

Navigate to the **Relationship Canvas** tab:
1. Double-click the blank canvas to register the newly created characters (`Aisha Mitchell` and `Ryan Vance`) as active nodes.
2. Drag and position the nodes cleanly.
3. Create a connection by dragging from the bottom handler (source) of Aisha to the top handler (target) of Ryan.
4. Double-click the connecting edge to open the **Edit Relationship** modal:
   - **Connection Label**: `Unresolved Tension`
   - **Aisha ➔ Ryan Perspective**:
     - **Trust**: `35%`
     - **Attachment**: `40%`
     - **Comfort**: `30%`
     - **Awkwardness**: `75%`
     - **Resentment**: `10%`
   - Click the tab for **Ryan ➔ Aisha Perspective**:
     - **Trust**: `75%`
     - **Attachment**: `80%`
     - **Comfort**: `65%`
     - **Awkwardness**: `45%`
     - **Resentment**: `0%`
   - Click **Save Dynamics** to close the editor.
5. Click **Save Canvas** at the top right of the screen to commit states to MongoDB.

### Verify Edge Visuals
- The edge displays a label containing the Trust percentage of the primary perspective: `"Unresolved Tension (Trust: 35%)"`.
- Since Trust is $35\%$, the connection stroke color resolves to **Yellow** (medium trust). If you update trust below $30\%$ it turns **Red** (guarded/hostile) and above $70\%$ it turns **Green** (highly trusting).

---

## 4. Interactive Sidebar Verification

Single-click the edge connecting `Aisha` and `Ryan`:
1. The **Relationship Dynamics Sidebar** slides in from the right.
2. Locate the **Perspective Dropdown** in the sidebar. 
3. Toggle between `Aisha ➔ Ryan` and `Ryan ➔ Aisha`.
4. Verify that:
   - Metric gauges (Trust, Attachment, Comfort, Awkwardness, Resentment) adjust instantly.
   - The **Connection Health Score** updates dynamically based on the calculation:
     $$\text{Health} = \text{Trust} + \text{Attachment} + \text{Comfort} - \text{Awkwardness} - \text{Resentment}$$
   - Aisha's perspective will yield a lower connection health score (~ $20\text{ pts}$), whereas Ryan's yields a much higher score (~ $175\text{ pts}$).

---

## 5. Narrative Growth Arcs

Navigate back to the **Characters** workspace:
1. Click **Aisha Mitchell** and open her **Character Arc** tab.
2. Verify her baseline arc status:
   - **Current Arc**: `Becoming emotionally open` (derived from default Growth Direction).
   - **Stage**: `Beginning`.
   - **Progression**: `0%` (represented by `░░░░░░░░░░░░░░░░░░ 0%` and a dark progress bar).
   - **Conflict**: `Fear of abandonment`.
3. Check the **Evolution Timeline** box. It should read: *"No scene progression recorded yet."*

---

## 6. Generative Scene Studio

Navigate to the **Scene Studio** workspace tab:
1. Under **Scene Parameters**, select the participating characters: Check both `Aisha Mitchell` and `Ryan Vance`.
2. Set the **Target Emotional Tone** to `tense`.
3. Enter your narrative prompt in the input box:
   > *"Aisha and Ryan are hiding in a dark, rain-soaked alleyway while a megacorp drone searches the main street. Ryan tries to start a conversation about why Aisha has been ignoring him since the hack, but Aisha remains hyper-focused on the drone."*
4. Click **Generate Scene**.

### Behind the Scenes Analysis (LLM Context Injection)
- **Character Brains**: Aisha's avoidant psychologies and Ryan's charismatic goals are injected into the LLM system prompt.
- **Dynamic Arcs**: Aisha's `Beginning` growth arc stage forces the AI writer to generate guarded, closed-off subtext for her dialogue.
- **Directional Relationships**: Aisha's low trust/comfort vs Ryan's high trust guide how they speak to each other.
- **Hidden Thoughts**: The backend calls Groq to generate private internal thought models (e.g. Aisha's hidden panic vs Ryan's motivation to connect) which dictate realistic script pauses, micro-expressions, and dialogue beats.

---

## 7. Analyzing Outputs & Outputs Pipeline

Once generation finishes:
1. **Scene Screenplay**: Read the resulting cinematic script. Aisha should sound guarded and defensive, and Ryan should display eager vulnerability, respecting their current arc progress.
2. **Dynamic Relationship Updates**: Scroll down to see updated relationship shifts. The LLM evaluates the scene text and modifies the directional parameters (e.g., Aisha's Trust increases slightly by $+4\%$ and Awkwardness shifts).
3. **Director & Image Pipeline**: 
   - Observe the **Director Actions** (lighting, camera directions, and ambient cues).
   - The generator builds a visual description combining character physical attributes and clothing styles with the environment.
   - Three cinematic storyboard keyframes are automatically generated by the image model (showing characters in their described black oversized hoodie and tech-wear bomber jacket).
4. **Memory Log**: The scene's emotional events are summarized and appended to the isolated MongoDB memory bank.

---

## 8. Verifying the Evolution Timeline

Navigate back to **Characters** ➔ **Aisha Mitchell** ➔ **Character Arc** tab:
1. Verify that Aisha's progress is no longer $0\%$.
2. The AI **Arc Analyzer** will have parsed the screenplay, updated her `current_state` (e.g., *"Starting to trust Ryan under pressure"*), and adjusted progression (e.g., `██░░░░░░░░░░░░░░░░ 12%`).
3. Under the **Character Evolution Timeline**, a new entry has been generated:
   - **Scene 1**: `Hiding in the Alley`
   - **Progress**: `12%`
   - **State**: *"Emotionally guarded, but showing micro-concessions to trust Ryan."*

---

## 9. Cleanup & Settings View

Navigate to the **Settings** workspace tab:
1. Type `"Cyberpunk Syndicate"` exactly in the confirmation field under the Danger Zone.
2. Notice the button remains disabled if you type something else.
3. Click the **Delete Project Universe** button.
4. Confirm in the browser confirmation alert.
5. Verify that a success toast slides in saying *"Project deleted"*, the sidebar resets to empty, and you are redirected to the Landing/Dashboard workspace view.
