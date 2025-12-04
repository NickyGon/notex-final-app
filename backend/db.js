const { Pool } = require('pg');

let config;

if (process.env.INSTANCE_CONNECTION_NAME) {
  // Running in Cloud Run / GCP, use Unix socket for Cloud SQL
  config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`, // 👈 key part
  };
} else {
  // Local/dev mode (Cloud Shell or your laptop)
  config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
  };
}

const pool = new Pool(config);

module.exports = pool;

