import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import fs from "fs";
import path from "path";
import axios from "axios";
import FormData from "form-data";

export async function POST(req) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ detail: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filepath = path.join(uploadDir, filename);
    fs.writeFileSync(filepath, buffer);

    const relativeUrl = `/uploads/${filename}`;

    // Call FastAPI to extract visual features
    let features = null;
    try {
      const fastApiFormData = new FormData();
      fastApiFormData.append("file", buffer, {
        filename: file.name,
        contentType: file.type,
      });

      const backendUrl = process.env.AI_BACKEND_URL || "http://127.0.0.1:8000";
      const fastApiRes = await axios.post(
        `${backendUrl}/extract-features`,
        fastApiFormData,
        {
          headers: fastApiFormData.getHeaders(),
          timeout: 45000,
        }
      );
      features = fastApiRes.data;
    } catch (apiErr) {
      console.error("FastAPI Feature Extraction Failed:", apiErr.message);
    }

    return NextResponse.json({
      url: relativeUrl,
      features: features || {
        gender: "",
        age: "",
        hair: "",
        eyes: "",
        skinTone: "",
        clothing: "",
        faceShape: "",
        appearance_summary: ""
      }
    });
  } catch (error) {
    console.error("Upload Avatar Error:", error);
    return NextResponse.json({ detail: "Server error during upload" }, { status: 500 });
  }
}
