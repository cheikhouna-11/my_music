const { connectToDatabase } = require('../../index');

function extractUserId(req) {
  const fromQuery = req.query?.userId || req.query?.id || null;
  const fromParams = req.params?.userId || req.params?.id || null;
  const fromBody = req.body?.userId || req.body?.id || null;
  return fromQuery || fromParams || fromBody || req.userId || null;
}

async function getProfile(req, res) {
  try {
    const userId = extractUserId(req);

    if (!userId) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'Identifiant utilisateur requis.' }));
      return;
    }

    const pool = await connectToDatabase();
    const [userRows] = await pool.query(
      `SELECT id, username, email, full_name, avatar_url, bio, created_at
       FROM users
       WHERE id = ? AND deleted = FALSE AND statut = 'actif'`,
      [userId]
    );

    if (!userRows || userRows.length === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'Profil introuvable.' }));
      return;
    }

    const [musicRows] = await pool.query(
      `SELECT id, title, artist, cover_url AS cover, audio_url AS audio, created_at
       FROM musiques
       WHERE user_id = ? AND deleted = FALSE AND statut = 'actif'
       ORDER BY created_at DESC`,
      [userId]
    );

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      user: userRows[0],
      musiques: musicRows
    }));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: false, error: error.message }));
  }
}

async function deleteMusique(req, res) {
  try {
    const musicId = req.params?.id || req.query?.id || null;
    const userId = extractUserId(req);

    if (!musicId || !userId) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'Identifiants manquants.' }));
      return;
    }

    const pool = await connectToDatabase();
    const [result] = await pool.query(
      `UPDATE musiques
       SET deleted = TRUE, updated_at = NOW()
       WHERE id = ? AND user_id = ? AND deleted = FALSE`,
      [musicId, userId]
    );

    if (result.affectedRows === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'Musique introuvable ou vous ne disposez pas des droits.' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'Musique supprimée avec succès.' }));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: false, error: error.message }));
  }
}

module.exports = {
  getProfile,
  deleteMusique
};
