// theme.js
window.ThemeManager = {
    init() {
        this.tg = window.Telegram?.WebApp;
        this.currentPreference = localStorage.getItem('app_theme') || 'telegram';
        
        // Listen for Telegram system theme changes
        if (this.tg) {
            this.tg.onEvent('themeChanged', () => {
                if (this.currentPreference === 'telegram') {
                    this.apply();
                }
            });
        }
        
        this.apply();
    },

    setTheme(preference) {
        if (!['telegram', 'light', 'dark'].includes(preference)) return;
        this.currentPreference = preference;
        localStorage.setItem('app_theme', preference);
        this.apply();
    },

    apply() {
        let isDark = false;
        
        if (this.currentPreference === 'dark') {
            isDark = true;
        } else if (this.currentPreference === 'light') {
            isDark = false;
        } else {
            // 'telegram' mode defaults to the system state
            isDark = this.tg?.colorScheme === 'dark';
        }

        document.body.classList.toggle('dark-mode', isDark);

        const headerColor = isDark ? '#0f172a' : '#f8fafc';
        const bgColor = isDark ? '#0f172a' : '#f8fafc';

        try {
            this.tg?.setHeaderColor?.(headerColor);
            this.tg?.setBackgroundColor?.(bgColor);
        } catch (_) {}

        // Safely update Chart.js colors if charts are loaded on the current page
        if (window.dailyChartInstance || window.pieChartInstance) {
            this.updateChartColors(isDark);
        }
    },

    updateChartColors(isDark) {
        if (!window.dailyChartInstance) return;

        const gridColor = isDark ? '#334155' : '#f1f5f9';
        const textColor = isDark ? '#94a3b8' : '#64748b';

        window.dailyChartInstance.options.scales.y.grid.color = gridColor;
        window.dailyChartInstance.options.scales.y.ticks.color = textColor;
        window.dailyChartInstance.options.scales.x.ticks.color = textColor;
        window.dailyChartInstance.update();
    }
};

// Initialize immediately upon script load
window.ThemeManager.init();
