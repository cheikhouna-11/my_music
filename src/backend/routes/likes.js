const { connectToDatabase } = require('../../index');

async function toggleLike(req, res) {
  try {
    const { musicId, userId, liked } = req.body || {};

    if (!musicId) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'Identifiant de musique requis.' }));
      return;
    }

    const pool = await connectToDatabase();
    const normalUserId = userId || null;

    if (liked) {
      await pool.query(
        `INSERT INTO likes (user_id, musique_id, statut, deleted, created_at, updated_at)
         VALUES (?, ?, 'actif', FALSE, NOW(), NOW())
         ON DUPLICATE KEY UPDATE deleted = FALSE, statut = 'actif', updated_at = NOW()`,
        [normalUserId, musicId]
      );
    } else {
      await pool.query(
        `UPDATE likes
         SET deleted = TRUE, statut = 'inactif', updated_at = NOW()
         WHERE musique_id = ? AND ((user_id = ?) OR (user_id IS NULL AND ? IS NULL))`,
        [musicId, normalUserId, normalUserId]
      );
    }

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, liked }));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: false, error: error.message }));
  }
}

module.exports = { toggleLike };
