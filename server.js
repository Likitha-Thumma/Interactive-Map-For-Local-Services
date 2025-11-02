require('dotenv').config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // serve frontend

// Initialize database
const db = new sqlite3.Database('./places.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    // Create places table
    db.run(`CREATE TABLE IF NOT EXISTS places (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      tags TEXT NOT NULL,
      description TEXT NOT NULL,
      rating REAL NOT NULL,
      reviews TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL
    )`);
  }
});

// ---------------- Signup ----------------
app.post("/api/signup", (req, res) => {
  const user = req.body;
  let users = [];
  const usersFile = path.join(__dirname, "users.json");

  // Load existing users
  if (fs.existsSync(usersFile)) {
    users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
  }

  // Check if email already exists
  if (users.some(u => u.email === user.email)) {
    return res.status(400).json({ message: "Email already registered" });
  }

  // Save new user
  users.push(user);
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

  res.json({ success: true, user });
});

// ---------------- Login ----------------
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const usersFile = path.join(__dirname, "users.json");
  let users = [];

  if (fs.existsSync(usersFile)) {
    users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
  }

  const user = users.find(u => u.email === email && u.password === password);

  if (user) {
    res.json({ success: true, user });
  } else {
    res.status(401).json({ message: "Invalid email or password" });
  }
});

// ---------------- Places API ----------------
app.get("/api/places", (req, res) => {
  db.all("SELECT * FROM places", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    // Parse JSON fields
    const places = rows.map(row => ({
      ...row,
      tags: JSON.parse(row.tags),
      reviews: JSON.parse(row.reviews)
    }));
    res.json(places);
  });
});

// ---------------- Config API ----------------
app.get("/api/config", (req, res) => {
  res.json({ googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY });
});

// ---------------- Start Server ----------------
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
