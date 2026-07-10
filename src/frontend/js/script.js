function normalizeTrack(track) {
    return {
        id: track.id,
        title: track.title || 'Titre inconnu',
        artist: track.artist || 'Artiste inconnu',
        cover: track.cover || track.cover_url || 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&auto=format&fit=crop&q=60',
        audio: track.audio || track.audio_url || '',
        created_at: track.created_at || null
    };
}

async function loadTracks() {
    try {
        const response = await fetch('/api/musiques');
        const data = await response.json();
        const normalized = Array.isArray(data) ? data.map(normalizeTrack) : [];
        window.mockTracks.splice(0, window.mockTracks.length, ...normalized);
        window.displayTracks(window.mockTracks);
    } catch (error) {
        console.error('Erreur lors du chargement des musiques :', error);
        window.displayTracks(window.mockTracks);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.initAuth();
    window.initPlayer();
    window.initLikes();
    window.initSearch();
    window.initShareModal();
    window.initNavbar();
    window.ensureDatabaseSchema();
    loadTracks();
});

window.loadTracks = loadTracks;