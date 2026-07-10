const playerState = {
    currentTrackId: null,
    isPlaying: false,
    audio: new Audio()
};

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function initPlayer() {
    const playBtn = document.getElementById('play-btn');
    const currentTitle = document.getElementById('current-title');
    const currentArtist = document.getElementById('current-artist');
    const currentCover = document.getElementById('current-cover');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const progressBar = document.getElementById('progress-bar');
    const currentTimeEl = document.getElementById('current-time');
    const totalDurationEl = document.getElementById('total-duration');

    if (!playBtn || !currentTitle || !currentArtist || !currentCover) {
        return;
    }

    const audio = playerState.audio;

    window.selectTrack = function selectTrack(trackOrId) {
        const track = typeof trackOrId === 'object'
            ? trackOrId
            : window.mockTracks.find((item) => item.id === trackOrId);

        if (!track) return;

        currentTitle.innerText = track.title;
        currentArtist.innerText = track.artist;
        currentCover.src = track.cover || 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&auto=format&fit=crop&q=60';

        playerState.currentTrackId = track.id;
        
        audio.src = track.audio || '';
        audio.play().then(() => {
            playerState.isPlaying = true;
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }).catch(err => {
            console.error("Erreur de lecture audio :", err);
        });
    };

    playBtn.addEventListener('click', () => {
        if (!playerState.currentTrackId) return;

        if (playerState.isPlaying) {
            audio.pause();
            playerState.isPlaying = false;
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
        } else {
            audio.play().then(() => {
                playerState.isPlaying = true;
                playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            }).catch(err => {
                console.error("Erreur de lecture audio :", err);
            });
        }
    });

    // Mettre à jour la barre de progression
    audio.addEventListener('timeupdate', () => {
        if (!audio.duration) return;
        const progress = (audio.currentTime / audio.duration) * 100;
        progressBar.value = progress;
        currentTimeEl.innerText = formatTime(audio.currentTime);
    });

    // Durée totale chargée
    audio.addEventListener('loadedmetadata', () => {
        totalDurationEl.innerText = formatTime(audio.duration);
    });

    // Permettre la recherche dans le titre via la barre de progression
    progressBar.addEventListener('input', () => {
        if (!audio.duration) return;
        const seekTime = (progressBar.value / 100) * audio.duration;
        audio.currentTime = seekTime;
    });

    // Lecture automatique du titre suivant
    audio.addEventListener('ended', () => {
        playNext();
    });

    function playNext() {
        if (!playerState.currentTrackId || window.mockTracks.length === 0) return;
        const currentIndex = window.mockTracks.findIndex(t => t.id === playerState.currentTrackId);
        const nextIndex = (currentIndex + 1) % window.mockTracks.length;
        window.selectTrack(window.mockTracks[nextIndex].id);
    }

    function playPrev() {
        if (!playerState.currentTrackId || window.mockTracks.length === 0) return;
        const currentIndex = window.mockTracks.findIndex(t => t.id === playerState.currentTrackId);
        const prevIndex = (currentIndex - 1 + window.mockTracks.length) % window.mockTracks.length;
        window.selectTrack(window.mockTracks[prevIndex].id);
    }

    if (nextBtn) nextBtn.addEventListener('click', playNext);
    if (prevBtn) prevBtn.addEventListener('click', playPrev);
}

window.initPlayer = initPlayer;
