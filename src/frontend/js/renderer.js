function renderTracks(tracks) {
    const musicGrid = document.getElementById('music-list');
    if (!musicGrid) return;

    musicGrid.innerHTML = '';

    if (tracks.length === 0) {
        musicGrid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; opacity:0.6;">Aucun titre trouvé.</p>';
        return;
    }

    tracks.forEach((track) => {
        const card = document.createElement('div');
        card.classList.add('music-card');
        card.addEventListener('click', () => window.selectTrack(track.id));

        card.innerHTML = `
            <div class="cover-wrapper">
                <img src="${track.cover}" alt="${track.title}">
            </div>
            <div class="card-info">
                <h3>${track.title}</h3>
                <p>${track.artist}</p>
                <div class="card-actions">
                    <button class="action-btn like-btn" data-music-id="${track.id}" onclick="event.stopPropagation(); window.toggleLikeFromUI(this, '${track.id}');"><i class="far fa-heart"></i></button>
                    <a class="action-btn" href="${track.audio || '#'}" download="${track.title}.mp3" onclick="event.stopPropagation(); window.trackDownload('${track.id}', '${track.title.replace(/'/g, "\\'")}');" title="Télécharger ${track.title}"><i class="fas fa-download"></i></a>
                </div>
            </div>
        `;
        musicGrid.appendChild(card);
    });
}

window.displayTracks = renderTracks;
