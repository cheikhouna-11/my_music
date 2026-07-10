/**
 * Envoie un fichier au microservice d'upload et retourne l'URL publique.
 * @param {File} file
 * @returns {Promise<string>} URL du fichier uploadé
 */
async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de l\'upload du fichier.');
    }

    // Retourner l'URL proxifiée via le serveur principal pour éviter les CORS
    return `/uploads/${data.fileName}`;
}

function initShareModal() {
    const shareFab = document.getElementById('share-fab');
    const shareModal = document.getElementById('share-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const shareForm = document.getElementById('share-form');
    const shareTitleInput = document.getElementById('share-title');
    const shareArtistInput = document.getElementById('share-artist');
    const shareAudioInput = document.getElementById('share-audio');
    const shareCoverInput = document.getElementById('share-cover');
    const shareAudioName = document.getElementById('share-audio-name');
    const shareCoverPreview = document.getElementById('share-cover-preview');
    const shareStatus = document.getElementById('share-form-status');

    if (!shareFab || !shareModal || !closeModalBtn || !shareForm) return;

    function openShareModal() {
        shareModal.classList.add('active');
        shareModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeShareModal() {
        shareModal.classList.remove('active');
        shareModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        shareForm.reset();
        shareAudioName.textContent = 'Aucun fichier sélectionné';
        shareCoverPreview.src = '';
        shareCoverPreview.classList.remove('show');
        shareStatus.textContent = '';
        shareStatus.className = 'form-status';
    }

    shareFab.addEventListener('click', () => {
        if (window.isUserConnected()) {
            openShareModal();
        } else {
            alert('Veuillez vous connecter pour partager une musique.');
            window.openAuthModal();
        }
    });
    closeModalBtn.addEventListener('click', closeShareModal);
    shareModal.addEventListener('click', (event) => {
        if (event.target === shareModal) {
            closeShareModal();
        }
    });

    shareAudioInput.addEventListener('change', () => {
        const file = shareAudioInput.files[0];
        shareAudioName.textContent = file ? file.name : 'Aucun fichier sélectionné';
    });

    shareCoverInput.addEventListener('change', () => {
        const file = shareCoverInput.files[0];
        if (!file) {
            shareCoverPreview.src = '';
            shareCoverPreview.classList.remove('show');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            shareCoverPreview.src = reader.result;
            shareCoverPreview.classList.add('show');
        };
        reader.readAsDataURL(file);
    });

    shareForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const title = shareTitleInput.value.trim();
        const artist = shareArtistInput.value.trim();
        const audioFile = shareAudioInput.files[0];
        const coverFile = shareCoverInput.files[0];

        if (!title || !artist || !audioFile) {
            shareStatus.textContent = 'Veuillez renseigner le titre, l\'artiste et un fichier audio.';
            shareStatus.className = 'form-status error';
            return;
        }

        // Désactiver le bouton et afficher l'état d'upload
        const submitBtn = shareForm.querySelector('.submit-btn');
        submitBtn.disabled = true;
        shareStatus.textContent = 'Upload en cours…';
        shareStatus.className = 'form-status';

        try {
            // 1. Uploader l'audio vers le microservice (stockage disque)
            shareStatus.textContent = 'Upload de l\'audio en cours…';
            const audioUrl = await uploadFile(audioFile);

            // 2. Uploader le cover si fourni, sinon image par défaut
            let coverUrl = 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&auto=format&fit=crop&q=60';
            if (coverFile) {
                shareStatus.textContent = 'Upload du cover en cours…';
                coverUrl = await uploadFile(coverFile);
            }

            // 3. Enregistrer la musique en base avec les URLs (pas de base64)
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
            shareStatus.textContent = 'Enregistrement en cours…';
            const response = await fetch('/api/musiques', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, artist, cover: coverUrl, audio: audioUrl, user_id: currentUser?.id || null })
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Erreur lors de l\'enregistrement.');
            }

            shareStatus.textContent = 'Musique partagée avec succès !';
            shareStatus.className = 'form-status success';
            setTimeout(() => {
                closeShareModal();
                window.loadTracks();
            }, 1000);

        } catch (error) {
            shareStatus.textContent = error.message;
            shareStatus.className = 'form-status error';
        } finally {
            submitBtn.disabled = false;
        }
    });
}

window.initShareModal = initShareModal;
