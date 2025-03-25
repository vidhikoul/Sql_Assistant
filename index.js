const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const { Groq } = require('groq-sdk');
const groq = new Groq({ apiKey: "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" });
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

app.get('/api/sql/schema', async (req, res) => {
  const { userQuery } = req.query; // Change from req.body to req.query

  if (!userQuery) {
    return res.status(400).json({ error: "No prompt found" });
  }

  try {
    const result = await groq.chat.completions.create({
      messages: [{ "role": "user", "content": `Generate only SQL schema and give me CREATE TABLE SQL statements only for this prompt: ${userQuery}` }],
      model: "llama-3.3-70b-versatile",
      temperature: 1,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: false
    });

    if (!result.choices || result.choices.length === 0) {
      throw new Error("No schema response from LLM");
    }

    const generatedQuery = result.choices[0]?.message?.content?.trim() || '';
    console.log("Generated Query:", generatedQuery);
    return res.status(200).json({ schema: generatedQuery });
  } catch (error) {
    console.error("Schema recommendation error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
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
app.get('/api/sql/generate', async (req, res) => {
  const { userQuery } = req.query;
  if (!userQuery) {
    return res.status(400).json({ error: 'No prompt found' });
  }

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ "role": "user", "content": `Give me only SQL query in Trino dialect without any explanation for text: ${userQuery}` }],
      model: "llama-3.3-70b-versatile",
      temperature: 1,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: false
    });

    if (!chatCompletion.choices || chatCompletion.choices.length === 0) {
      throw new Error("No response from LLM");
    }

    const generatedQuery = chatCompletion.choices[0]?.message?.content?.trim() || '';
    console.log("Generated Query:", generatedQuery);
    res.status(200).json({ sql_query: generatedQuery });
  } catch (error) {
    console.error("SQL generation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
