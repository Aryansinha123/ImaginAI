import clientPromise from "@/lib/mongodb";
import { getUserIdFromRequest } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function PUT(req) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return Response.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    const { username, avatarUrl, label } = await req.json();

    const client = await clientPromise;
    const db = client.db("imaginai_db");

    const updateDoc = {};
    if (username !== undefined) updateDoc.username = username.trim();
    if (avatarUrl !== undefined) updateDoc.avatarUrl = avatarUrl.trim();
    if (label !== undefined) updateDoc.label = label.trim();

    if (Object.keys(updateDoc).length === 0) {
      return Response.json({ detail: "No fields to update" }, { status: 400 });
    }

    const result = await db.collection("users").findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: updateDoc },
      { returnDocument: "after" }
    );

    if (!result) {
      return Response.json({ detail: "User not found" }, { status: 404 });
    }

    return Response.json({
      id: result._id.toString(),
      username: result.username,
      avatarUrl: result.avatarUrl || "",
      label: result.label || "Writer"
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return Response.json({ detail: "Server error" }, { status: 500 });
  }
}
