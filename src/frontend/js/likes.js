function toggleLikeFromUI(button, musicId) {
    if (!button) return;

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const liked = button.classList.contains('liked');

    button.classList.toggle('liked');
    const icon = button.querySelector('i');

    if (button.classList.contains('liked')) {
        icon.classList.replace('far', 'fas');
    } else {
        icon.classList.replace('fas', 'far');
    }

    fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ musicId, userId: currentUser?.id || null, liked: !liked })
    }).catch((error) => {
        console.error('Erreur lors de l’enregistrement du like :', error);
    });
}

function initLikes() {
    document.addEventListener('click', (event) => {
        const button = event.target.closest('.action-btn.like-btn');
        if (!button) return;

        event.stopPropagation();
        toggleLikeFromUI(button, button.dataset.musicId);
    });
}

window.toggleLikeFromUI = toggleLikeFromUI;
window.initLikes = initLikes;
