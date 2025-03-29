const mysql = require('mysql2');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

let dbConnection;

function connectDB(host, user, password, port, database) {
  return new Promise((resolve, reject) => {
    dbConnection = mysql.createConnection({
      host: host,
      user: user,
      password: password,
      port: port,
      database: database,
      ssl: {
        rejectUnauthorized: false,
      }
    });

    dbConnection.connect((err) => {
      if (err) {
        console.error('Database connection failed:', err.message);
        return reject({ success: false, error: err.message });
      }
      console.log('Connected to the database.');
      resolve({ success: true });
    });
  });
}

function executeDB(query, values = []) {
  return new Promise((resolve, reject) => {
    if (!dbConnection) {
      return reject(new Error('Database not connected.'));
    }

    dbConnection.query(query, values, (err, results) => {
      if (err) {
        return reject(err);
      }
      resolve(results);
    });
  });
}

// Export functions
module.exports = { connectDB, executeDB };
