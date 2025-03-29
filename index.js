const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Groq } = require('groq-sdk');
const { connectDB, executeDB } = require('./config/db.js'); // Import DB functions

dotenv.config();

const groq = new Groq({ apiKey: "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" });
const app = express();

app.use(cors());
app.use(express.json());

let isConnected = false;

// Auth routes
const authrouter = require("./routes/authenticationRoutes");
app.use('/api/auth', authrouter);

// API to connect to MySQL database
app.post('/api/sql/connect', async (req, res) => {
  const { host, user, password, database, port } = req.body;

  if (!host || !user || !password || !database || !port) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const result = await connectDB(host, user, password, port, database);
    if (result.success) {
      isConnected = true;
    }
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: "Database connection failed", details: error });
  }
});

// API to execute SQL query
app.post('/api/sql/query', async (req, res) => {
  if (!isConnected) {
    return res.status(400).json({ success: false, message: 'Not connected to any database' });
  }

  try {
    console.log("Executing query: ", req.body.query);
    const result = await executeDB(req.body.query);
    console.log("Query Result: ", result);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// API to generate SQL schema
app.get('/api/sql/schema', async (req, res) => {
  const { userQuery } = req.query;

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

// API to generate SQL query
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
