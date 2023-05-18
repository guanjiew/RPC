const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
const port = 3000;

// Enable CORS
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database("game_results.db");

db.run(`CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player1 TEXT,
  player2 TEXT,
  result TEXT
)`);

// Handle POST requests to record game results
app.post("/record", (req, res) => {
  const { playerChoice, computerChoice, result } = req.body;
  console.log("Recording game result:", playerChoice, computerChoice, result);

  db.run(
    "INSERT INTO games (player1, player2, result) VALUES (?, ?, ?)",
    [playerChoice, computerChoice, result],
    (err) => {
      if (err) {
        console.error("Error recording game result:", err.message);
        res.sendStatus(500);
      } else {
        console.log("Game result recorded successfully.");
        res.sendStatus(200);
      }
    }
  );
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
