const { connectToDatabase } = require('../../index');

async function getAllMusiques(req, res) {
  try {
    const pool = await connectToDatabase();
    const [rows] = await pool.query(`
      SELECT id, title, artist, cover_url AS cover, audio_url AS audio, duration_seconds, genre, description, statut, deleted, created_at, updated_at
      FROM musiques
      WHERE deleted = FALSE AND statut = 'actif'
      ORDER BY created_at DESC
    `);

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(rows));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: false, error: error.message }));
  }
}

async function createMusique(req, res) {
  try {
    const body = req.body || {};
    const { title, artist, cover, audio, genre, description, user_id } = body;

    if (!title || !artist || !audio) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'Titre, artiste et audio sont requis.' }));
      return;
    }

    const MAX_BASE64_SIZE = 1024 * 1024 * 100;

    if (typeof audio === 'string' && audio.startsWith('data:') && audio.length > MAX_BASE64_SIZE) {
      res.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'Le fichier audio est trop volumineux. La taille maximale autorisée est de 100 Mo.' }));
      return;
    }

    if (typeof cover === 'string' && cover.startsWith('data:') && cover.length > MAX_BASE64_SIZE) {
      res.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'Le fichier cover est trop volumineux. La taille maximale autorisée est de 100 Mo.' }));
      return;
    }

    const pool = await connectToDatabase();
    const [result] = await pool.query(
      `INSERT INTO musiques (title, artist, cover_url, audio_url, genre, description, user_id, statut, deleted, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'actif', FALSE, NOW(), NOW())`,
      [title, artist, cover || null, audio, genre || null, description || null, user_id || null]
    );

    res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, id: result.insertId, message: 'Musique ajoutée avec succès.' }));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: false, error: error.message }));
  }
}

module.exports = {
  getAllMusiques,
  createMusique
};
