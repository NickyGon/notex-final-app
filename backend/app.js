require('dotenv').config();
const express = require('express');
const routes = require('./routes');
const cors = require('cors');
const app = express();

app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Mount your routes
app.use('/', routes);

// Health check route (useful for Cloud Run)
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Cloud Run uses PORT env var
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
