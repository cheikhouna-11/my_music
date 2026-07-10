async function loadProfilePage() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profileMeta = document.getElementById('profile-meta');
    const profileAvatar = document.getElementById('profile-avatar');
    const profileCount = document.getElementById('profile-count');
    const musicsContainer = document.getElementById('profile-musics');

    if (!currentUser) {
        window.location.href = '/';
        return;
    }

    if (profileName) profileName.textContent = currentUser.username || 'Utilisateur';
    if (profileEmail) profileEmail.textContent = currentUser.email || '—';
    if (profileAvatar) profileAvatar.textContent = (currentUser.username || 'U').charAt(0).toUpperCase();

    try {
        const response = await fetch(`/api/profile?userId=${currentUser.id}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Impossible de charger le profil.');
        }

        const user = data.user || {};
        if (profileMeta) {
            const createdAt = user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '—';
            profileMeta.textContent = `Membre depuis ${createdAt}`;
        }

        if (profileCount) {
            profileCount.textContent = `${(data.musiques || []).length}`;
        }

        if (!musicsContainer) return;

        if (!data.musiques || data.musiques.length === 0) {
            musicsContainer.innerHTML = '<p class="empty-state">Aucune musique partagée pour le moment.</p>';
            return;
        }

        musicsContainer.innerHTML = data.musiques.map((music) => `
            <article class="music-card profile-music-card">
                <div class="cover-wrapper">
                    <img src="${music.cover || 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&auto=format&fit=crop&q=60'}" alt="${music.title}">
                </div>
                <div class="card-info">
                    <h3>${music.title}</h3>
                    <p>${music.artist}</p>
                </div>
                <div class="card-actions">
                    <button class="action-btn" type="button" onclick="window.playTrackFromProfile(${JSON.stringify(music)})"><i class="fas fa-play"></i></button>
                    <button class="action-btn danger" type="button" onclick="deleteUserMusic(${music.id})"><i class="fas fa-trash"></i></button>
                </div>
            </article>
        `).join('');
    } catch (error) {
        if (musicsContainer) {
            musicsContainer.innerHTML = `<p class="empty-state">${error.message}</p>`;
        }
    }
}

window.playTrackFromProfile = function playTrackFromProfile(music) {
    if (window.selectTrack) {
        window.selectTrack({
            id: music.id,
            title: music.title,
            artist: music.artist,
            cover: music.cover,
            audio: music.audio
        });
    }
};

window.deleteUserMusic = async function deleteUserMusic(id) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser) return;

    if (!confirm('Supprimer cette musique ?')) return;

    try {
        const response = await fetch(`/api/profile/${id}?userId=${currentUser.id}`, {
            method: 'DELETE'
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Impossible de supprimer la musique.');
        }

        await loadProfilePage();
    } catch (error) {
        alert(error.message);
    }
};

window.trackDownload = function trackDownload(id, title) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser) return;

    fetch('/api/downloads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ musicId: id, userId: currentUser.id, title })
    }).catch(() => {});
};

document.addEventListener('DOMContentLoaded', () => {
    window.initAuth();
    window.initNavbar();
    loadProfilePage();
});

window.loadProfilePage = loadProfilePage;
