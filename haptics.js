// haptics.js
window.Haptics = {
    isEnabled() {
        return localStorage.getItem('app_vibration') !== 'false';
    },

    selection() {
        if (!this.isEnabled()) return;
        try {
            window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
        } catch (_) {}
    },

    impact(style = 'light') {
        if (!this.isEnabled()) return;
        try {
            window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);
        } catch (_) {}
    },

    notification(type = 'success') {
        if (!this.isEnabled()) return;
        try {
            window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(type);
        } catch (_) {}
    }
};

// Global wrapper for backward compatibility with older components
window.triggerHaptic = function(type = 'light') {
    if (type === 'selection') {
        window.Haptics.selection();
    } else if (['success', 'warning', 'error'].includes(type)) {
        window.Haptics.notification(type);
    } else {
        window.Haptics.impact(type);
    }
};
