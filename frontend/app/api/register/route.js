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
    if (!username || !password || username.length < 3 || password.length < 6) {
      return Response.json(
        { detail: "Invalid username or password length" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("imaginai_db");

    // Check if user exists
    const existingUser = await db.collection("users").findOne({
      username: { $regex: new RegExp(`^${username}$`, "i") }
    });

    if (existingUser) {
      return Response.json(
        { detail: "Username is already taken" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user
    const newUser = {
      username,
      password_hash: hashedPassword,
      created_at: new Date().toISOString()
    };
    
    const result = await db.collection("users").insertOne(newUser);
    const userId = result.insertedId.toString();

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
        username
      }
    });

  } catch (error) {
    console.error("Register Error:", error);
    return Response.json(
      { detail: "Server error during registration" },
      { status: 500 }
    );
  }
}
