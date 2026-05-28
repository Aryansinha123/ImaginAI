import { create } from "zustand";
import API from "../lib/api";

export const useStore = create((set, get) => ({
  user: null, // object: { id, username }
  token: null,
  projects: [],
  activeProject: null,
  activeView: "Dashboard",
  activeScene: null,
  characters: [],
  scenes: [],
  canvasNodes: [],
  canvasEdges: [],
  isLoading: false,
  isGenerating: false,
  authError: null,
  authInitialized: false,

  initAuth: () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("imaginai_token");
      const userStr = localStorage.getItem("imaginai_user");
      if (token && userStr) {
        set({ token, user: JSON.parse(userStr) });
        get().fetchProjects();

        // Restore active project and view
        const savedProject = localStorage.getItem("imaginai_active_project");
        const savedView = localStorage.getItem("imaginai_active_view");
        if (savedProject) {
          try {
            const project = JSON.parse(savedProject);
            set({ activeProject: project });
            get().fetchProjectData(project.id);
            get().fetchCanvasState(project.id);
          } catch (e) {
            console.error("Error loading active project from local storage:", e);
          }
        }
        if (savedView) {
          set({ activeView: savedView });
        }
      }
      set({ authInitialized: true });
    }
  },

  register: async (username, password) => {
    set({ isLoading: true, authError: null });
    try {
      const res = await API.post("/register", { username, password });
      const { access_token, user } = res.data;
      localStorage.setItem("imaginai_token", access_token);
      localStorage.setItem("imaginai_user", JSON.stringify(user));
      set({ token: access_token, user, isLoading: false });
      get().fetchProjects();
      return true;
    } catch (err) {
      const msg = err.response?.data?.detail || "Registration failed";
      set({ authError: msg, isLoading: false });
      return false;
    }
  },

  login: async (username, password) => {
    set({ isLoading: true, authError: null });
    try {
      const res = await API.post("/login", { username, password });
      const { access_token, user } = res.data;
      localStorage.setItem("imaginai_token", access_token);
      localStorage.setItem("imaginai_user", JSON.stringify(user));
      set({ token: access_token, user, isLoading: false });
      get().fetchProjects();
      return true;
    } catch (err) {
      const msg = err.response?.data?.detail || "Login failed";
      set({ authError: msg, isLoading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem("imaginai_token");
    localStorage.removeItem("imaginai_user");
    localStorage.removeItem("imaginai_active_project");
    localStorage.removeItem("imaginai_active_view");
    set({
      user: null,
      token: null,
      projects: [],
      activeProject: null,
      activeView: "Dashboard",
      characters: [],
      scenes: [],
      authError: null
    });
  },

  fetchProjects: async () => {
    try {
      const res = await API.get("/projects");
      set({ projects: res.data });
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  },

  createProject: async (name) => {
    try {
      const res = await API.post("/projects", { name });
      set((state) => ({
        projects: [res.data, ...state.projects]
      }));
      get().setActiveProject(res.data);
    } catch (err) {
      console.error("Error creating project:", err);
    }
  },

  setActiveProject: (project) => {
    set({ activeProject: project, activeView: "Dashboard", activeScene: null, characters: [], scenes: [], canvasNodes: [], canvasEdges: [] });
    if (typeof window !== "undefined") {
      if (project) {
        localStorage.setItem("imaginai_active_project", JSON.stringify(project));
        localStorage.setItem("imaginai_active_view", "Dashboard");
      } else {
        localStorage.removeItem("imaginai_active_project");
        localStorage.removeItem("imaginai_active_view");
      }
    }
    if (project) {
      get().fetchProjectData(project.id);
      get().fetchCanvasState(project.id);
    }
  },

  setActiveView: (view) => {
    set({ activeView: view });
    if (typeof window !== "undefined") {
      localStorage.setItem("imaginai_active_view", view);
    }
  },
  setActiveScene: (scene) => set({ activeScene: scene }),

  fetchProjectData: async (projectId) => {
    set({ isLoading: true });
    try {
      const [charRes, sceneRes] = await Promise.all([
        API.get(`/projects/${projectId}/characters`),
        API.get(`/projects/${projectId}/scenes`)
      ]);
      set({
        characters: charRes.data,
        scenes: sceneRes.data,
        isLoading: false
      });
    } catch (err) {
      console.error("Error fetching project details:", err);
      set({ isLoading: false });
    }
  },

  fetchCanvasState: async (projectId) => {
    try {
      const res = await API.get(`/projects/${projectId}/canvas`);
      set({
        canvasNodes: res.data.nodes || [],
        canvasEdges: res.data.edges || []
      });
    } catch (err) {
      console.error("Error fetching canvas state:", err);
    }
  },

  saveCanvasState: async (projectId, nodes, edges) => {
    try {
      await API.put(`/projects/${projectId}/canvas`, { nodes, edges });
      set({ canvasNodes: nodes, canvasEdges: edges });
    } catch (err) {
      console.error("Error saving canvas state:", err);
    }
  },

  createCharacter: async (characterData) => {
    const { activeProject } = get();
    if (!activeProject) return null;
    try {
      const res = await API.post(`/projects/${activeProject.id}/characters`, characterData);
      set((state) => ({
        characters: [...state.characters, res.data]
      }));
      return res.data;
    } catch (err) {
      console.error("Error creating character:", err);
      return null;
    }
  },

  updateCharacter: async (projectId, characterId, characterData) => {
    try {
      const res = await API.patch(`/projects/${projectId}/characters/${characterId}`, characterData);
      set((state) => ({
        characters: state.characters.map((c) => (c.id === characterId ? res.data : c))
      }));
      return res.data;
    } catch (err) {
      console.error("Error updating character:", err);
      return null;
    }
  },

  deleteCharacter: async (projectId, characterId) => {
    try {
      await API.delete(`/projects/${projectId}/characters/${characterId}`);
      set((state) => ({
        characters: state.characters.filter((c) => c.id !== characterId)
      }));
      return true;
    } catch (err) {
      console.error("Error deleting character:", err);
      return false;
    }
  },

  renameProject: async (projectId, name) => {
    try {
      const res = await API.patch(`/projects/${projectId}`, { name });
      set((state) => ({
        projects: state.projects.map((p) => (p.id === projectId ? res.data : p)),
        activeProject: state.activeProject?.id === projectId ? res.data : state.activeProject
      }));
    } catch (err) {
      console.error("Error renaming project:", err);
    }
  },

  deleteProject: async (projectId) => {
    try {
      await API.delete(`/projects/${projectId}`);
      set((state) => {
        const remaining = state.projects.filter((p) => p.id !== projectId);
        const nextActive = remaining[0] || null;
        return {
          projects: remaining,
          activeProject: nextActive,
          characters: [],
          scenes: [],
          canvasNodes: [],
          canvasEdges: []
        };
      });
      const { activeProject } = get();
      get().setActiveProject(activeProject);
    } catch (err) {
      console.error("Error deleting project:", err);
    }
  },

  updateScene: async (projectId, sceneId, sceneData) => {
    try {
      const res = await API.patch(`/projects/${projectId}/scenes/${sceneId}`, sceneData);
      set((state) => ({
        scenes: state.scenes.map((s) => (s.id === sceneId ? res.data : s))
      }));
    } catch (err) {
      console.error("Error updating scene:", err);
    }
  },

  deleteScene: async (projectId, sceneId) => {
    try {
      await API.delete(`/projects/${projectId}/scenes/${sceneId}`);
      set((state) => ({
        scenes: state.scenes.filter((s) => s.id !== sceneId)
      }));
    } catch (err) {
      console.error("Error deleting scene:", err);
    }
  },

  reorderScenes: async (projectId, orderedSceneIds) => {
    set((state) => {
      const sceneMap = new Map(state.scenes.map(s => [s.id, s]));
      const sortedScenes = orderedSceneIds
        .map((id, index) => {
          const scene = sceneMap.get(id);
          if (scene) {
            return { ...scene, order: index };
          }
          return null;
        })
        .filter(Boolean);
      return { scenes: sortedScenes };
    });

    try {
      await API.post(`/projects/${projectId}/scenes/reorder`, { sceneIds: orderedSceneIds });
    } catch (err) {
      console.error("Error persisting scene order:", err);
      get().fetchProjectData(projectId);
    }
  },

  duplicateScene: async (projectId, scene) => {
    try {
      const { title, prompt, tone, characterIds, generated_text } = scene;
      const res = await API.post(`/projects/${projectId}/scenes`, {
        title: `${title} (Copy)`,
        scene: prompt,
        tone,
        characterIds,
        generated_text
      });
      set((state) => ({
        scenes: [...state.scenes, res.data].sort((a, b) => a.order - b.order)
      }));
    } catch (err) {
      console.error("Error duplicating scene:", err);
    }
  },

  generateScene: async (scenePrompt, characterIds, title, tone) => {
    const { activeProject } = get();
    if (!activeProject) return null;
    set({ isGenerating: true });
    try {
      const res = await API.post(`/projects/${activeProject.id}/scenes`, {
        scene: scenePrompt,
        characterIds,
        title,
        tone: tone || "neutral"
      });
      set((state) => ({
        scenes: [...state.scenes, res.data].sort((a, b) => a.order - b.order),
        isGenerating: false
      }));
      return res.data;
    } catch (err) {
      console.error("Error generating scene:", err);
      set({ isGenerating: false });
      return null;
    }
  },

  regenerateScene: async (sceneId, scenePrompt, characterIds, title, tone) => {
    const { activeProject } = get();
    if (!activeProject) return null;
    set({ isGenerating: true });
    try {
      const genRes = await API.post(`/projects/${activeProject.id}/scenes`, {
        scene: scenePrompt,
        characterIds,
        title,
        tone: tone || "neutral"
      });
      const generatedText = genRes.data.generated_text;
      const direction = genRes.data.direction;
      const image = genRes.data.image;

      await API.delete(`/projects/${activeProject.id}/scenes/${genRes.data.id}`);

      const patchRes = await API.patch(`/projects/${activeProject.id}/scenes/${sceneId}`, {
        title,
        prompt: scenePrompt,
        tone: tone || "neutral",
        characterIds,
        generated_text: generatedText,
        direction,
        image
      });

      set((state) => ({
        scenes: state.scenes.map((s) => (s.id === sceneId ? patchRes.data : s)),
        isGenerating: false
      }));
      return patchRes.data;
    } catch (err) {
      console.error("Error regenerating scene:", err);
      set({ isGenerating: false });
      return null;
    }
  }
}));
