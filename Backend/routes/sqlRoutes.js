const express = require('express');
const router = express.Router(); // This is the correct object for handling routes
const db = require('../config/db.js'); // Import the connection function

let isConnected = false;

// API to connect to MySQL database
router.post("/connect", async (req, res) => {  // Use router.post() instead of app.post()
    const { host, port, user, password, database } = req.body;

    if (!host || !user || !password || !database) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const result = await db.connectDB({ host, port, user, password, database });

    if (result.success) {
        isConnected = true;
    }

    res.status(result.success ? 200 : 500).json(result);
});

// API to execute SQL query
router.post("/query", async (req, res) => {
    if (!isConnected) {
        return res.status(400).json({ success: false, message: "Not connected to any database" });
    }

    try {
        const result = await db.executeQuery(req.body.query);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Existing route for SQL query generation (unchanged)
router.post("/generate", (req, res) => {
  res.json({ generatedSQL: 'SELECT * FROM ...' });
});

module.exports = router;
