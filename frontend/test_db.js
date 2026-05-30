const { MongoClient } = require('mongodb');

async function main() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("imaginai_db");
    
    const lastScene = await db.collection("scenes").find({}).sort({ created_at: -1 }).limit(1).toArray();
    console.log("Last Scene:", JSON.stringify(lastScene[0], null, 2));

  } finally {
    await client.close();
  }
}

main().catch(console.error);
