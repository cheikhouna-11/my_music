async function ensureDatabaseSchema() {
    try {
        const response = await fetch('/api/checkdb');
        const data = await response.json();
        console.log('Vérification de la base de données :', data);
    } catch (error) {
        console.error('Erreur lors de la vérification de la base de données :', error);
    }
}

window.ensureDatabaseSchema = ensureDatabaseSchema;
