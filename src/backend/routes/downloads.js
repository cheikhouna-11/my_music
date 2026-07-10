const { connectToDatabase } = require('../../index');

async function trackDownload(req, res) {
  try {
    const { musicId, userId } = req.body || {};

    if (!musicId) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'Identifiant de musique requis.' }));
      return;
    }

    const pool = await connectToDatabase();
    const normalUserId = userId || null;
    const [existingRows] = await pool.query(
      `SELECT id FROM nb_telechargements
       WHERE musique_id = ? AND ((user_id = ? ) OR (user_id IS NULL AND ? IS NULL))
       LIMIT 1`,
      [musicId, normalUserId, normalUserId]
    );

    if (existingRows && existingRows.length > 0) {
      await pool.query(
        `UPDATE nb_telechargements
         SET nombre_telechargements = nombre_telechargements + 1, updated_at = NOW()
         WHERE id = ?`,
        [existingRows[0].id]
      );
    } else {
      await pool.query(
        `INSERT INTO nb_telechargements (musique_id, user_id, nombre_telechargements, statut, deleted, created_at, updated_at)
         VALUES (?, ?, 1, 'actif', FALSE, NOW(), NOW())`,
        [musicId, normalUserId]
      );
    }

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'Téléchargement enregistré.' }));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: false, error: error.message }));
  }
}

module.exports = { trackDownload };
