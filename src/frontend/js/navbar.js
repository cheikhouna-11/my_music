function initNavbar() {
    const actionButtons = document.querySelectorAll('.navbar-action-btn');
    const searchToggle = document.getElementById('search-toggle');
    const searchBar = document.getElementById('search-bar');
    const searchClose = document.getElementById('search-close');

    const applyTheme = (theme) => {
        document.body.classList.toggle('theme-light', theme === 'light');
    };

    const detectThemeFromMomentService = async () => {
        try {
            const response = await fetch('http://localhost:3004/api/time-of-day');
            const data = await response.json();
            console.log('Réponse du service moment :', data);
            const isDarkTheme = data?.period === 'soir';
            applyTheme(isDarkTheme ? 'dark' : 'light');
        } catch (error) {
            applyTheme('light');
        }
    };

    detectThemeFromMomentService();

    actionButtons.forEach((button) => {
        button.addEventListener('click', () => {
            if (button.id === 'search-toggle') {
                searchBar?.classList.add('active');
                return;
            }

            actionButtons.forEach((item) => item.classList.remove('active'));
            button.classList.add('active');
        });
    });

    if (searchClose) {
        searchClose.addEventListener('click', () => {
            searchBar?.classList.remove('active');
        });
    }

    document.addEventListener('click', (event) => {
        if (!searchBar || !searchToggle) return;
        const clickedInside = searchBar.contains(event.target) || searchToggle.contains(event.target);
        if (!clickedInside) {
            searchBar.classList.remove('active');
        }
    });
}

window.initNavbar = initNavbar;
