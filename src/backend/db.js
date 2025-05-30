require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.MYSQLHOST || 'metro.proxy.rlwy.net',
  port: process.env.MYSQLPORT || 21770,
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || 'HCpMMbFvlMwsINVPdaHgetSLsfqsUPhG',
  database: process.env.MYSQLDATABASE || 'parcial_int',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// **Función corregida** (usa `pool.query` directamente)
async function testConnection() {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    console.log('✅ Conexión a DB exitosa. Resultado:', rows[0].result);
  } catch (err) {
    console.error('❌ Error de conexión a DB:', err);
  }
}

testConnection();

module.exports = pool;