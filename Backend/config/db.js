const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Function to create a connection dynamically based on user input
const createConnection = async ({ dbHost, dbUser, dbPassword, dbName }) => {
  const timeout = 10000;
  const connection = await mysql.createConnection({
    host: dbHost,
    port: 15035, // Default MySQL port; can be customized as needed
    user: dbUser,
    password: dbPassword,
    database: dbName,
    charset: 'utf8mb4',
    connectTimeout: timeout,
  });
  return connection;
};

module.exports.createConnection = createConnection;
