const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sqlRoutes = require('./routes/sqlRoutes');  // Import sqlRoutes

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Register the routes
app.use('/api/sql', sqlRoutes);  // Ensure this is correct

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
