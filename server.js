const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const https = require('https');
const fs = require('fs');


const app = express();
const port = 3000;

const corsOptions = {
  origin: "http://localhost:8080",
  methods: "GET, POST",
  credentials: true,
};

app.use(cors(corsOptions));

app.use(cookieParser());

app.use(function (req, res, next) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(express.json());

app.use(function (req, res, next) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }
  next();
});


app.post("/login", (req, res) => {
  res.cookie('session', 'valid', {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    sameSite: 'none', // SameSite value should be 'none' for cross-origin requests
    secure: true // Ensure the cookie is only sent over HTTPS
  });
  res.set('Access-Control-Allow-Credentials', 'true'); // Allow credentials (cookies) to be sent

  res.json({ message: "Logged in successfully!" });
});

app.post("/logout", (req, res) => {
  res.clearCookie('session');
  res.json({ message: "Logged out successfully!" });
});


const db = new sqlite3.Database("game_results.db", (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to the database.");
  }
});

db.run(
  `CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player1 TEXT,
  player2 TEXT,
  result TEXT
)`,
  (err) => {
    if (err) {
      console.error("Error creating games table:", err.message);
    } else {
      console.log("Games table created successfully.");
    }
  }
);

// Handle POST requests to record game results
app.post("/record", (req, res) => {
  if (!req.cookies.session) {
    res.status(401).send('Unauthorized');
    return;
  }
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

// Endpoint to retrieve game results with pagination
app.get("/game-results", (req, res) => {
  const { page, pageSize } = req.query;

  // Prepare the pagination parameters
  const limit = parseInt(pageSize);
  const offset = (parseInt(page) - 1) * parseInt(pageSize) || 0;

  console.log("Retrieving game results with pagination:", limit, offset);

  // Query the database for game results with pagination
  const query = `SELECT * FROM games LIMIT ? OFFSET ?`;
  db.all(query, [limit, offset], (err, rows) => {
    if (err) {
      console.error("Error retrieving game results:", err);
      res.status(500).send("Error retrieving game results");
      return;
    }

    // Query the database for the total number of game results
    const countQuery = `SELECT COUNT(*) AS count FROM games`;
    db.get(countQuery, (countErr, { count }) => {
      if (countErr) {
        console.error("Error retrieving game results count:", countErr);
        res.status(500).send("Error retrieving game results count");
        return;
      }

      // Calculate the total number of pages
      const totalPages = Math.ceil(count / limit);

      // Prepare the response object
      const response = {
        results: rows,
        totalPages,
      };

      // Send the response
      res.json(response);
    });
  });
});

// Start the server
const server = https.createServer(
  {
    key: fs.readFileSync('certs/private.key'),
    cert: fs.readFileSync('certs/certificate.pem')
  },
  app
)
server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
