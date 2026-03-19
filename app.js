// Single Page Application Router
// Handles smooth page transitions without reloading

class SlayStationApp {
    constructor() {
        this.currentPage = 'home';
        this.pages = {};
        this.init();
    }

    init() {
        // Setup navigation
        this.setupNavigation();
        
        // Load initial page
        const hash = window.location.hash.substring(1) || 'home';
        this.loadPage(hash);
        
        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            const hash = window.location.hash.substring(1) || 'home';
            this.loadPage(hash);
        });
    }

    setupNavigation() {
        // Intercept all navigation links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (!link) return;
            
            const href = link.getAttribute('href');
            
            // Check if it's an internal link
            if (href.startsWith('#') || href.includes('.html')) {
                e.preventDefault();
                
                let pageId = href.replace('#', '').replace('.html', '');
                
                // Map HTML files to page IDs
                if (href.includes('index.html')) pageId = 'home';
                if (href.includes('wallets.html')) pageId = 'wallets';
                if (href.includes('accessories.html')) pageId = 'accessories';
                if (href.includes('track-order.html')) pageId = 'track-order';
                if (href.includes('login.html')) pageId = 'login';
                if (href.includes('signup.html')) pageId = 'signup';
                
                this.loadPage(pageId);
                
                // Update URL
                if (href.startsWith('#')) {
                    window.history.pushState({ page: pageId }, '', href);
                } else {
                    window.history.pushState({ page: pageId }, '', '#' + pageId);
                }
            }
        });
    }

    loadPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page-container').forEach(page => {
            page.style.display = 'none';
            page.classList.remove('active');
        });

        // Show target page
        const targetPage = document.getElementById(`page-${pageId}`);
        if (targetPage) {
            targetPage.style.display = 'block';
            setTimeout(() => {
                targetPage.classList.add('active');
            }, 10);
            this.currentPage = pageId;
            
            // Load page-specific scripts
            this.loadPageScripts(pageId);
        } else {
            // Fallback to home
            this.loadPage('home');
        }
    }

    loadPageScripts(pageId) {
        // Execute page-specific initialization
        if (pageId === 'wallets' && typeof renderProducts === 'function') {
            renderProducts();
        }
        if (pageId === 'accessories' && typeof renderProducts === 'function') {
            renderProducts();
        }
        if (pageId === 'track-order' && typeof trackOrder === 'function') {
            // Track order page is already loaded
        }
    }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new SlayStationApp();
    window.app = app; // Make globally available
});
