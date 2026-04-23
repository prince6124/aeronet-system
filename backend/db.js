const { Pool } = require("pg");
const { MongoClient } = require("mongodb");
require("dotenv").config();

// ── PostgreSQL ────────────────────────────────────────
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pgPool.on("error", (err) => {
  console.error("PostgreSQL error:", err.message);
});

// ── MongoDB ───────────────────────────────────────────
const mongoClient = new MongoClient(process.env.MONGO_URI);
let mongoDB;

async function connectMongo() {
  await mongoClient.connect();
  // Use "aeronetsystem" — the database your collections are in
  mongoDB = mongoClient.db("aeronetsystem");
  const collections = await mongoDB.listCollections().toArray();
  console.log("MongoDB connected — collections:", collections.map(c => c.name));
}

function getDB() {
  return mongoDB;
}

module.exports = { pgPool, connectMongo, getDB };