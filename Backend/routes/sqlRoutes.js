const express = require('express');
const router = express.Router();
const db = require('../config/db.js'); // Import the connection function

// New route to handle connecting to the database
router.post('/connect', async (req, res) => {
  const { dbHost, dbUser, dbPassword, dbName } = req.body;

  try {
    const connection = await db.createConnection({ dbHost, dbUser, dbPassword, dbName });
    await connection.query('SELECT 1'); // Check if the connection is successful
    res.json({ success: true, message: 'Successfully connected to the database!' });
  } catch (error) {
    console.error('Database connection error:', error);
    res.json({ success: false, message: 'Failed to connect to the database' });
  }
});

// Route to execute a SQL query
router.post('/execute', async (req, res) => {
  const { query, dbHost, dbUser, dbPassword, dbName } = req.body;

  try {
    const connection = await db.createConnection({ dbHost, dbUser, dbPassword, dbName });
    const [rows] = await connection.execute(query); // Execute the dynamic query
    res.json({ success: true, results: rows });
  } catch (error) {
    console.error('Error executing query:', error);
    res.json({ success: false, message: 'Error executing query' });
  }
});

// Existing route for SQL query generation (unchanged)
router.post('/generate', (req, res) => {
  res.json({ generatedSQL: 'SELECT * FROM ...' });
});

module.exports = router;
