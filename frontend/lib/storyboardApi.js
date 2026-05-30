import API from "./api";

export async function generateStoryboard(scene) {
  const { data } = await API.post("/storyboard", { scene });
  return data;
}
