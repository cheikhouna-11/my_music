const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 4002;
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
const baseUrl = process.env.BASE_URL || `http://127.0.0.1:${PORT}`;

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/mp4', 'video/mp4'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'));
    }
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'upload' });
});

app.post('/upload', (req, res) => {
  upload.single('file')(req, res, (error) => {
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Aucun fichier reçu' });
    }

    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      fileName: req.file.filename,
      path: `/uploads/${req.file.filename}`,
      url: fileUrl,
      size: req.file.size,
      mimeType: req.file.mimetype
    });
  });
});

app.use('/uploads', express.static(uploadDir));

app.listen(PORT, () => {
  console.log(`Microservice upload démarré sur le port ${PORT}`);
});
