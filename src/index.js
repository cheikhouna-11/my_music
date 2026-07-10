const mysql = require('mysql2/promise');

let pool = null;

async function connectToDatabase() {
  if (pool) {
    return pool;
  }

  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'my_music',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    maxAllowedPacket: 1024 * 1024 * 64,
    connectTimeout: 60000,
    enableKeepAlive: true
  };

  try {
    pool = mysql.createPool(config);
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    console.log(`Connexion à la base de données réussie sur ${config.host}:${config.port}/${config.database}`);
    return pool;
  } catch (error) {
    console.error('Échec de la connexion à la base de données :', error.message);
    throw error;
  }
}

async function closeDatabaseConnection() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = {
  connectToDatabase,
  closeDatabaseConnection
};
