const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');
const path = require('path');

const REGION = process.env.AWS_REGION || 'eu-west-1';
const BUCKET = process.env.S3_BUCKET_NAME;

const s3Client = new S3Client({ region: REGION });

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/jpg',
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav',
  'audio/ogg', 'audio/mp4', 'video/mp4'
];

/**
 * GET /api/upload/presign?filename=xxx&contentType=yyy
 * Génère une URL présignée S3 (PUT) que le navigateur utilisera pour uploader
 * directement le fichier vers S3, sans passer par le serveur applicatif.
 */
async function getPresignedUploadUrl(req, res) {
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: false, error: 'Méthode non autorisée' }));
    return;
  }

  const { filename, contentType } = req.query;

  if (!filename || !contentType) {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: false, error: 'Paramètres filename et contentType requis.' }));
    return;
  }

  if (!ALLOWED_TYPES.includes(contentType)) {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: false, error: 'Type de fichier non autorisé.' }));
    return;
  }

  if (!BUCKET) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: false, error: 'S3_BUCKET_NAME non configuré côté serveur.' }));
    return;
  }

  // Nom de fichier unique, non prévisible, pour éviter les collisions et l'énumération
  const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(8).toString('hex');
  const extension = path.extname(filename);
  const key = `uploads/${uniqueSuffix}${extension}`;

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType
    });

    // URL valable 5 minutes : assez large pour un upload depuis un navigateur,
    // assez court pour limiter le risque si l'URL fuite quelque part.
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    const publicUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, uploadUrl, publicUrl, key }));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: false, error: 'Erreur génération URL présignée : ' + error.message }));
  }
}

module.exports = { getPresignedUploadUrl };
