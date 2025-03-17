// db.js
const mysql = require('mysql2/promise');
dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Global variable to store DB connection
let dbConnection = null;

// Connect to the database
async function connectDB({ host, port, user, password, database }) {
  try {
    dbConnection = await mysql.createConnection({
      host,
      port: port || 15035,  // Default port
      user,
      password,
      database,
      charset: 'utf8mb4',
      connectTimeout: 10000,
      ssl: { rejectUnauthorized: false } // SSL support for cloud databases
    });

    console.log('Connected to database successfully!');
    return { success: true, message: 'Connected successfully' };
  } catch (error) {
    console.error('Database Connection Error:', error);
    return { success: false, message: error.message };
  }
}

// Execute a query
async function executeQuery(query) {
  if (!dbConnection) {
    throw new Error('Not connected to any database.');
  }
  const [rows] = await dbConnection.execute(query);
  return rows;
}

// Export the functions for use in other files
module.exports = { connectDB, executeQuery };
