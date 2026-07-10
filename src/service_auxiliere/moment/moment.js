const express = require('express');
const app = express();
const PORT = process.env.PORT || 3004;

// Middleware pour autoriser le JSON
app.use(express.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }

    next();
});

/**
 * Route principale : Détermine si c'est le matin ou le soir
 * Matin : de 06:00 à 17:59
 * Soir : de 18:00 à 05:59
 */
app.get('/api/time-of-day', (req, res) => {
    const currentHour = new Date().getHours();
    let period = '';

    if (currentHour >= 6 && currentHour < 18) {
        period = 'matin';
    } else {
        period = 'soir';
    }

    res.json({
        success: true,
        hour: currentHour,
        period: period,
        message: `Actuellement, c'est le ${period}.`
    });
});

// Gestion des routes inconnues
app.use((req, res) => {
    res.status(404).json({ error: "Route non trouvée" });
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Microservice démarré sur le port ${PORT}`);
});