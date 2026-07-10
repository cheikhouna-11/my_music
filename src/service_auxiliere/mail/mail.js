const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4001;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'mail' });
});

app.post('/send', async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;

    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({ error: 'Paramètres invalides' });
    }

    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.example.com',
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: process.env.SMTP_USERNAME || 'user@example.com',
        pass: process.env.SMTP_PASSWORD || 'password'
      }
    });

    const fromName = process.env.SMTP_FROM_NAME || 'My Music';
    const fromEmail = process.env.SMTP_FROM_EMAIL || 'no-reply@my-music.app';

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      text,
      html
    });

    res.status(200).json({ success: true, message: 'Email envoyé' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Échec d’envoi de l’email' });
  }
});

app.listen(PORT, () => {
  console.log(`Microservice mail démarré sur le port ${PORT}`);
});
