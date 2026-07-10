function initSearch() {
    const searchInput = document.getElementById('music-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', (event) => {
        const value = event.target.value.toLowerCase();
        const filteredTracks = window.mockTracks.filter((track) =>
            track.title.toLowerCase().includes(value) ||
            track.artist.toLowerCase().includes(value)
        );
        window.displayTracks(filteredTracks);
    });
}

window.initSearch = initSearch;
