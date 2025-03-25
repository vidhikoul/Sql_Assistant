const express = require('express');
const cors = require('cors');
const axios = require('axios');
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

app.post('/api/sql/schema', async (req, res)=>{
  const {userQuery} = req.body;
  if(!userQuery){
    return  res.status(404).json({error : "No prompt found"});
  }
  const result = await axios.post("http://74.225.201.145:8000/query", {
    Headers : {
      "Content-Type": "application/json"
    },
    query:  `Generate only sql schema and give me Create Table sql statements only for this prompt : ${userQuery}`
  });
  console.log(result);
  return res.status(200).json({ schema:  result.data['sql_query']});
})

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
app.post('/api/sql/generate',async (req, res) => {
  if (!isConnected) {
    return res.status(400).json({ success: false, message: 'Not connected to any database' });
  }
  console.log(req.body.userQuery);
  if(!req.body.userQuery){
    return res.status(404).json({success : false, message : "Prompt not found"});
  }
  try{
  // Get all tables in the database
  const tables = await executeQuery("SHOW TABLES");
  const tableNames = tables.map((row) => row["Tables_in_defaultdb"]);
  let createStatements = "";
  for (let table of tableNames) {
    const [result] = await executeQuery(`SHOW CREATE TABLE \`${table}\``);
    createStatements += result["Create Table"] + "; ";
  }
  // const query = createStatements + "\nquery for:" + req.body.userQuery;
  const query = `Give me only sql query in trino dialect without any explaination for text : ${req.body.userQuery} Consider this schema : ${createStatements}`;
  const generatedSQL = await axios.post("http://74.225.201.145:8000/query", {
    Headers : {
      "Content-Type": "application/json"
    },
    query:  query.toString()
  });
  return res.status(200).json({ generatedSQL:  generatedSQL.data['sql_query']});
}catch(error){
  console.log("Query generation error : " + error);
  return res.status(500).json({success: false, message: error.message })
}
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
