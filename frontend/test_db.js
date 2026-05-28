const { MongoClient } = require('mongodb');

async function main() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("imaginai_db");
    
    const projects = await db.collection("projects").find({}).toArray();
    for (let p of projects) {
      console.log(`Project: ${p.name}`);
      console.log(`Edges:`, JSON.stringify(p.canvas_edges, null, 2));
    }
    
    const scenes = await db.collection("scenes").find({}).sort({created_at: -1}).limit(2).toArray();
    console.log(`\nLast 2 Scenes:`);
    for (let s of scenes) {
      console.log(`Scene title: ${s.title}, deltas: ${JSON.stringify(s.emotion_deltas)}`);
    }

  } finally {
    await client.close();
  }
}

main().catch(console.error);
