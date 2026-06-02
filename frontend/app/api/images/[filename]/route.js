import axios from "axios";

export async function GET(req, { params }) {
  const { filename } = await params;
  const { searchParams } = new URL(req.url);
  const download = searchParams.get("download") === "true";
  const title = searchParams.get("title") || "image";

  try {
    const backendUrl = process.env.AI_BACKEND_URL || "http://127.0.0.1:8000";
    const response = await axios.get(`${backendUrl}/generated_images/${filename}`, {
      responseType: "arraybuffer",
    });

    const headers = new Headers();
    headers.set("Content-Type", response.headers["content-type"] || "image/png");

    if (download) {
      // Clean up title for filename
      const cleanTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      headers.set("Content-Disposition", `attachment; filename="${cleanTitle}_${filename}"`);
    }

    return new Response(response.data, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Proxy image error:", error);
    return new Response("Image not found", { status: 404 });
  }
}
