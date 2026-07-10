// Gestion de la session utilisateur et de l'authentification
const authState = {
    user: null
};

// Vérifier si l'utilisateur est connecté au chargement de la page
function loadUserSession() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            authState.user = JSON.parse(savedUser);
            updateProfileButton();
        } catch (e) {
            localStorage.removeItem('currentUser');
        }
    }
}

// Retourne vrai si un utilisateur est connecté
window.isUserConnected = function isUserConnected() {
    return authState.user !== null;
};

// Fonction pour mettre à jour l'icône de profil ou le texte
function updateProfileButton() {
    const profileBtn = document.getElementById('profile-btn');
    if (!profileBtn) return;

    if (authState.user) {
        // Utilisateur connecté : afficher ses initiales ou son nom

    } else {
        // Non connecté : afficher l'icône utilisateur par défaut
        profileBtn.innerHTML = '<i class="fas fa-user"></i>';
        profileBtn.title = 'Se connecter / S\'inscrire';
    }
}

window.logoutUser = function logoutUser() {
    localStorage.removeItem('currentUser');
    authState.user = null;
    updateProfileButton();
    if (window.location.pathname.includes('profile')) {
        window.location.href = '/';
    }
};

// Fonction globale pour ouvrir le modal d'authentification
window.openAuthModal = function openAuthModal() {
    const authModal = document.getElementById('auth-modal');
    if (!authModal) return;

    // Réinitialiser les étapes
    showStep('login');

    authModal.classList.add('active');
    authModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
};

function closeAuthModal() {
    const authModal = document.getElementById('auth-modal');
    if (!authModal) return;

    authModal.classList.remove('active');
    authModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    // Réinitialiser les formulaires
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const otpForm = document.getElementById('otp-form');

    if (loginForm) loginForm.reset();
    if (registerForm) registerForm.reset();
    if (otpForm) otpForm.reset();

    const loginStatus = document.getElementById('login-status');
    const registerStatus = document.getElementById('register-status');
    const otpStatus = document.getElementById('otp-status');

    if (loginStatus) loginStatus.textContent = '';
    if (registerStatus) registerStatus.textContent = '';
    if (otpStatus) otpStatus.textContent = '';
}

// Basculer entre les étapes du modal d'authentification
function showStep(stepName) {
    const steps = {
        login: document.getElementById('auth-login-step'),
        register: document.getElementById('auth-register-step'),
        otp: document.getElementById('auth-otp-step')
    };

    Object.keys(steps).forEach(key => {
        if (steps[key]) {
            steps[key].classList.remove('active');
        }
    });

    const activeStep = steps[stepName];
    if (activeStep) {
        requestAnimationFrame(() => {
            activeStep.classList.add('active');
        });
    }
}

function initAuth() {
    loadUserSession();

    const profileBtn = document.getElementById('profile-btn');
    const closeAuthBtn = document.getElementById('close-auth-modal');
    const authModal = document.getElementById('auth-modal');

    // Navigation entre étapes
    const goToRegister = document.getElementById('go-to-register');
    const goToLogin = document.getElementById('go-to-login');
    const goBackRegister = document.getElementById('go-back-register');

    // Formulaires
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const otpForm = document.getElementById('otp-form');

    // Status
    const loginStatus = document.getElementById('login-status');
    const registerStatus = document.getElementById('register-status');
    const otpStatus = document.getElementById('otp-status');

    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            if (window.isUserConnected()) {
                window.location.href = '/profile.html';
            } else {
                window.openAuthModal();
            }
        });
    }

    if (closeAuthBtn) closeAuthBtn.addEventListener('click', closeAuthModal);
    if (authModal) {
        authModal.addEventListener('click', (event) => {
            if (event.target === authModal) {
                closeAuthModal();
            }
        });
    }

    if (goToRegister) {
        goToRegister.addEventListener('click', (e) => {
            e.preventDefault();
            showStep('register');
        });
    }

    if (goToLogin) {
        goToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            showStep('login');
        });
    }

    if (goBackRegister) {
        goBackRegister.addEventListener('click', (e) => {
            e.preventDefault();
            showStep('register');
        });
    }

    // Connexion
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;

            loginStatus.textContent = 'Connexion en cours…';
            loginStatus.className = 'form-status';

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();
                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Erreur lors de la connexion.');
                }

                authState.user = data.user;
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                updateProfileButton();

                loginStatus.textContent = 'Connexion réussie !';
                loginStatus.className = 'form-status success';

                setTimeout(() => {
                    closeAuthModal();
                }, 900);

            } catch (err) {
                loginStatus.textContent = err.message;
                loginStatus.className = 'form-status error';
            }
        });
    }

    // Inscription (demande OTP)
    let pendingEmail = '';
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('register-username').value.trim();
            const email = document.getElementById('register-email').value.trim();
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm-password').value;

            registerStatus.textContent = 'Envoi du code OTP…';
            registerStatus.className = 'form-status';

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password, confirmPassword })
                });

                const data = await response.json();
                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Erreur lors de l\'inscription.');
                }

                pendingEmail = email;
                const otpMessage = document.getElementById('otp-message');
                if (otpMessage) {
                    otpMessage.innerHTML = `Saisissez le code à 6 chiffres envoyé à <span class="otp-highlight">${email}</span>.`;
                }

                registerStatus.textContent = '';
                registerStatus.className = 'form-status';
                showStep('otp');

            } catch (err) {
                registerStatus.textContent = err.message;
                registerStatus.className = 'form-status error';
            }
        });
    }

    // Validation OTP
    if (otpForm) {
        otpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const otp = document.getElementById('otp-code').value.trim();

            otpStatus.textContent = 'Vérification du code…';
            otpStatus.className = 'form-status';

            try {
                const response = await fetch('/api/auth/verify-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: pendingEmail, otp })
                });

                const data = await response.json();
                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Code OTP invalide.');
                }

                otpStatus.textContent = 'Inscription validée ! Vous pouvez maintenant vous connecter.';
                otpStatus.className = 'form-status success';

                setTimeout(() => {
                    const loginEmail = document.getElementById('login-email');
                    if (loginEmail) {
                        loginEmail.value = pendingEmail;
                    }
                    showStep('login');
                    otpStatus.textContent = '';
                    otpStatus.className = 'form-status';
                    otpForm.reset();
                }, 1200);

            } catch (err) {
                otpStatus.textContent = err.message;
                otpStatus.className = 'form-status error';
            }
        });
    }
}

window.initAuth = initAuth;
