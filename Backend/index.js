const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Import the database connection functions from db.js
const { connectDB, executeQuery } = require('./config/db.js');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Database connection flag
let isConnected = false;

// API to connect to MySQL database
app.post('/api/sql/connect', async (req, res) => {
  const { dbHost, dbUser, dbPassword, dbName, dbPort } = req.body;

  if (!dbHost || !dbUser || !dbPassword || !dbName) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const result = await connectDB({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName
  });

  if (result.success) {
    isConnected = true;
  }

  res.status(result.success ? 200 : 500).json(result);
});

// API to execute SQL query
app.post('/api/sql/query', async (req, res) => {
  if (!isConnected) {
    return res.status(400).json({ success: false, message: 'Not connected to any database' });
  }

  try {
    console.log("Executing query: ", req.body.query);  // Log the query for debugging
    const result = await executeQuery(req.body.query);  // Execute the query using executeQuery function
    console.log("Query Result: ", result);  // Log the result for debugging

    // Return the query result in a proper format
    res.json({ success: true, data: result });  // Sending the result in the response
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route to generate SQL queries (example)
app.post('/api/sql/generate', (req, res) => {
  res.json({ generatedSQL: 'SELECT * FROM ...' });
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
