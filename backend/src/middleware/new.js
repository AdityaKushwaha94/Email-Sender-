const express = require("express");
const jsonwebtoken = require("jsonwebtoken");
const User = require("../models/User");
const app = express();

app.get("/", async (req, res) => {
  res.json({
    message: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.get("/trying", (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(401).json({ error: "Access denied. No token provided." });
      return;
    }
    if (token != "validtoken123") {
      res.status(403).json(error.message);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
