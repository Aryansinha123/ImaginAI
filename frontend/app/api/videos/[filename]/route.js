import axios from "axios";

export async function GET(req, { params }) {
  const { filename } = await params;
  const range = req.headers.get("range");

  try {
    const headers = {};
    if (range) {
      headers["range"] = range;
    }

    const backendUrl = process.env.AI_BACKEND_URL || "http://127.0.0.1:8000";
    const response = await axios.get(`${backendUrl}/generated_images/${filename}`, {
      headers,
      responseType: "arraybuffer",
      validateStatus: () => true // Allow any status code (like 206 Partial Content) to pass through
    });

    const resHeaders = new Headers();
    // Copy headers from backend response
    Object.entries(response.headers).forEach(([key, value]) => {
      if (!["transfer-encoding", "content-encoding", "connection"].includes(key.toLowerCase())) {
        resHeaders.set(key, value);
      }
    });

    // Ensure proper content type
    if (!resHeaders.has("content-type")) {
      resHeaders.set("content-type", "video/mp4");
    }

    return new Response(response.data, {
      status: response.status,
      headers: resHeaders,
    });
  } catch (error) {
    console.error("Proxy video error:", error);
    return new Response("Video not found", { status: 404 });
  }
}
