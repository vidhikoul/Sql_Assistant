// db.js
const mysql = require('mysql2');
dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Global variable to store DB connection
const dbConnection = mysql.createConnection(
  {
    host : process.env.DB_HOST,
    user : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    port : process.env.DB_PORT,
    database : process.env.DB_NAME,
    ssl : {
      rejectUnauthorized : true,
      ca : process.env.DB_CA_CERT
    }
  }
);

dbConnection.connect((err)=>{
  if(err){
    console.log("Error in connecting to DB :" + err);
    return;
  }
  console.log("Connected to DB");
})

// Export the functions for use in other files
module.exports = dbConnection;
