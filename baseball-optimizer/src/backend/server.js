// src/backend/server.js
import express from "express";
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 5000;

let db;
const dbName = "Optimizer";

app.use(cors({
  origin: "http://localhost:5173",
}));

app.use(express.json());

const uri = process.env.MONGO_URI;
if (!uri)
   throw new Error("Missing MongoDB URI");

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function connectToDatabase() {
  try {
    await client.connect();
    db = client.db(dbName);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
}
};



app.get("/", (req, res) => {
  res.send("yo");
});

// get all teams for a user
app.get("/api/teams", async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }
  try {
    const teamsCollection = db.collection("Teams");
    const teams = await teamsCollection.find({ user_id: userId }).toArray();
    res.status(200).json(teams);
  } catch (error) {
    console.error("Error fetching teams:", error);
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});

// add a user
app.post("/api/users", async (req, res) => {
  const { user_id, full_name, email } = req.body;
  try {
    const usersCollection = db.collection("Users");
    const result = await usersCollection.updateOne(
      { user_id },
      { $set: { user_id,full_name, email } },
      { upsert: true }
    )
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error inserting user:", error);
    res.status(500).json({ error });
  }
});

// add a team
app.post("/api/teams", async (req, res) => {
  const { user_id, team_name, season, division } = req.body;
  try {
    const teamsCollection = db.collection("Teams");
    const result = await teamsCollection.updateOne(
      { user_id, team_name, season, division },
      { 
        $set: { user_id, team_name, season, division } ,
        $setOnInsert: {team_id: new ObjectId()},
      },
      { upsert: true }
    )
    return res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error });
  }
});

// add a player to a team
app.post("/api/teams/:team_id/players", async (req, res) => {
  const { player_name, skill, positions, gender } = req.body;
  const { team_id } = req.params;
  try {
    const playersCollection = db.collection("Players");
    const result = await playersCollection.updateOne(
      { player_name, skill, positions, team_id },
      { 
        $set: { player_name, skill, positions, team_id, gender } ,
        $setOnInsert: {player_id: new ObjectId().toString()},
      },
      { upsert: true }
    )
    return res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error });
  }
});

// update a player for a team
app.post("/api/teams/:team_id/players/update", async (req, res) => {
  const { player_name, skill, positions, gender, player_id } = req.body;
  const { team_id } = req.params;
  console.log(player_id, team_id);
  try {
    const playersCollection = db.collection("Players");
    const result = await playersCollection.updateOne(
      // check if player with same teamID and playerID exists
      { player_id, team_id },
      { 
        // update player if it exists, else insert with  player_id
        $set: { player_name, skill, positions, team_id, gender, player_id } ,
      }
    )
    return res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error });
  }
});

// get all players for a team
app.get("/api/teams/:team_id/players", async(req, res) => {
  const { team_id } = req.params;
  try {
    const playersCollection = db.collection("Players");
    const result = await playersCollection.find({ team_id }).toArray();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error });
  }
})

app.post("/api/teams/:team_id/importance", async (req, res) => {
  const { user_id, importance } = req.body;
  const { team_id } = req.params;
  try {
    const importanceCollection = db.collection("Position_Importance");
    const result = await importanceCollection.updateOne(
      { team_id, user_id },
      { 
        $set: { 
          team_id, 
          user_id, 
          importance: { importance }  // Explicitly ensure full object is stored
      } ,
      }, { upsert: true }
    )
    return res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error });
  }
})

app.get("/api/teams/:team_id/importance", async(req, res) => {
  const { team_id } = req.params;
  try {
    const importanceCollection = db.collection("Position_Importance");
    const result = await importanceCollection.findOne({ team_id });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error });
  }
})

connectToDatabase().then(() => {
  app.listen(PORT, () =>{
    console.log(`Server running on http://localhost:${PORT}`)})
  });

