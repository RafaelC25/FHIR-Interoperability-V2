const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'parcial_int',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Prueba de conexión
pool.query('SELECT 1 + 1 AS result')
  .then(() => console.log('✅ Conexión a DB exitosa'))
  .catch(err => console.error('❌ Error de conexión a DB:', err));

module.exports = pool;