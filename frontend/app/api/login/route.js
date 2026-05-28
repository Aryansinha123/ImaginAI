import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    let body;
    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      const params = new URLSearchParams(text);
      body = Object.fromEntries(params.entries());
    } else {
      body = await req.json();
    }

    const { username, password } = body;
    if (!username || !password) {
      return Response.json(
        { detail: "Missing username or password" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("imaginai_db");

    // Find user
    const user = await db.collection("users").findOne({
      username: { $regex: new RegExp(`^${username}$`, "i") }
    });

    if (!user) {
      return Response.json(
        { detail: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return Response.json(
        { detail: "Invalid username or password" },
        { status: 401 }
      );
    }

    const userId = user._id.toString();

    // Create JWT
    const token = jwt.sign(
      { sub: userId },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "24h" }
    );

    return Response.json({
      access_token: token,
      token_type: "bearer",
      user: {
        id: userId,
        username: user.username
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    return Response.json(
      { detail: "Server error during login" },
      { status: 500 }
    );
  }
}
