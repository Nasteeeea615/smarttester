const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'smarttester',
  password: '20na28ST_50',
  port: 5432,
});

module.exports = pool;