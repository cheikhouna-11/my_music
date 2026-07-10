const { connectToDatabase } = require('../../index');

const requiredTables = ['users', 'musiques', 'likes', 'partages', 'news', 'nb_telechargements'];

async function ensureDatabaseSchema() {
  const pool = await connectToDatabase();
  const [rows] = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
  `);

  const existingTables = new Set(rows.map((row) => row.table_name));
  const missingTables = requiredTables.filter((table) => !existingTables.has(table));

  if (missingTables.length === 0) {
    return {
      success: true,
      message: 'Toutes les tables sont présentes.',
      created: []
    };
  }

  const createStatements = [
    `CREATE TABLE IF NOT EXISTS users (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(100) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(150),
      avatar_url TEXT,
      bio TEXT,
      statut VARCHAR(20) NOT NULL DEFAULT 'actif',
      deleted BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS musiques (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      artist VARCHAR(255) NOT NULL,
      cover_url TEXT,
      audio_url TEXT NOT NULL,
      duration_seconds INT,
      genre VARCHAR(100),
      description TEXT,
      user_id BIGINT,
      statut VARCHAR(20) NOT NULL DEFAULT 'actif',
      deleted BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS likes (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT NOT NULL,
      musique_id BIGINT NOT NULL,
      statut VARCHAR(20) NOT NULL DEFAULT 'actif',
      deleted BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_likes_musique FOREIGN KEY (musique_id) REFERENCES musiques(id) ON DELETE CASCADE,
      CONSTRAINT uq_user_musique_like UNIQUE (user_id, musique_id)
    )`,
    `CREATE TABLE IF NOT EXISTS partages (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT NOT NULL,
      musique_id BIGINT NOT NULL,
      destination VARCHAR(255),
      message TEXT,
      statut VARCHAR(20) NOT NULL DEFAULT 'actif',
      deleted BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_partages_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_partages_musique FOREIGN KEY (musique_id) REFERENCES musiques(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS news (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      author_id BIGINT,
      image_url TEXT,
      statut VARCHAR(20) NOT NULL DEFAULT 'actif',
      deleted BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_news_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS nb_telechargements (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      musique_id BIGINT NOT NULL,
      user_id BIGINT,
      nombre_telechargements INT NOT NULL DEFAULT 0,
      statut VARCHAR(20) NOT NULL DEFAULT 'actif',
      deleted BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_nb_dl_musique FOREIGN KEY (musique_id) REFERENCES musiques(id) ON DELETE CASCADE,
      CONSTRAINT fk_nb_dl_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )`
  ];

  for (const statement of createStatements) {
    await pool.query(statement);
  }

  try {
    await pool.query(`ALTER TABLE musiques ADD COLUMN IF NOT EXISTS user_id BIGINT`);
  } catch (error) {
    console.warn('Impossible d’ajouter la colonne user_id à musiques :', error.message);
  }

  return {
    success: true,
    message: 'Tables vérifiées et créées si nécessaire.',
    created: missingTables
  };
}

module.exports = {
  ensureDatabaseSchema
};
