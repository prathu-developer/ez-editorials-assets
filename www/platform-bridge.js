// platform-bridge.js - Unified Platform Abstraction Layer
// Standardized adapter for Telegram Mini App, Android App (Capacitor), and Desktop Web.

(function (window) {
    'use strict';

    const APP_VERSION = "1.0.2";

    const PlatformBridge = {
        version: APP_VERSION,

        /**
         * Detects the current execution platform:
         * 'telegram' | 'capacitor' | 'web'
         */
        getPlatform() {
            if (typeof isCapacitorApp === 'function' && isCapacitorApp()) return 'capacitor';
            if (typeof isTelegramMiniApp === 'function' && isTelegramMiniApp()) return 'telegram';
            return 'web';
        },

        /**
         * Returns true if running in Telegram Mini App (mobile or desktop client)
         */
        isTelegram() {
            return this.getPlatform() === 'telegram';
        },

        /**
         * Returns true if running in Capacitor Native Android wrapper
         */
        isCapacitor() {
            return this.getPlatform() === 'capacitor';
        },

        /**
         * Returns true only for true desktop browser viewports (>= 1024px).
         * Telegram Desktop runs inside a narrow ~420px iframe, which is NOT desktop web.
         */
        isDesktop() {
            if (typeof isDesktopWeb === 'function') return isDesktopWeb();
            const tgPlatform = window.Telegram?.WebApp?.platform || '';
            const isTgDesktopClient = ['tdesktop', 'macos', 'web', 'weba', 'webk'].includes(tgPlatform);
            if (isTgDesktopClient || this.isTelegram()) return false;
            const ua = navigator.userAgent || '';
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
            return !isMobile && window.innerWidth >= 1024;
        },

        /**
         * Returns true for mobile screens or mobile app wrappers
         */
        isMobile() {
            return !this.isDesktop();
        },

        /**
         * Safe Haptic Feedback bridge:
         * - Telegram: uses Telegram.WebApp.HapticFeedback
         * - Capacitor: uses window.Capacitor.Plugins.Haptics
         * - Web / Fallback: uses navigator.vibrate or silent no-op
         */
        haptic(type = 'light') {
            try {
                if (localStorage.getItem('app_vibration') === 'false') return;

                // 1. Telegram Mini App
                const tgHaptic = window.Telegram?.WebApp?.HapticFeedback;
                if (tgHaptic) {
                    if (['light', 'medium', 'heavy', 'rigid', 'soft'].includes(type)) {
                        tgHaptic.impactOccurred(type);
                    } else if (['success', 'warning', 'error'].includes(type)) {
                        tgHaptic.notificationOccurred(type);
                    } else if (type === 'selection') {
                        tgHaptic.selectionChanged();
                    }
                    return;
                }

                // 2. Capacitor Android Plugins
                const capHaptics = window.Capacitor?.Plugins?.Haptics;
                if (capHaptics) {
                    const styleMap = {
                        light: 'LIGHT',
                        medium: 'MEDIUM',
                        heavy: 'HEAVY'
                    };
                    if (styleMap[type]) {
                        capHaptics.impact({ style: styleMap[type] });
                    } else if (['success', 'warning', 'error'].includes(type)) {
                        capHaptics.notification({ type: type.toUpperCase() });
                    } else {
                        capHaptics.selectionChanged();
                    }
                    return;
                }

                // 3. Browser Fallback
                if (navigator.vibrate) {
                    const duration = type === 'selection' ? 12 : (type === 'heavy' ? 40 : 22);
                    navigator.vibrate(duration);
                }
            } catch (e) {
                // Silently swallow vibration errors
            }
        },

        /**
         * Returns standardized authentication headers for all API calls
         */
        getAuthHeaders(customHeaders = {}) {
            if (typeof getAuthHeaders === 'function') {
                return getAuthHeaders(customHeaders);
            }
            const headers = {
                'Content-Type': 'application/json',
                ...customHeaders
            };
            if (this.isTelegram()) {
                headers['X-Telegram-Init-Data'] = window.Telegram?.WebApp?.initData || '';
            } else {
                const token = localStorage.getItem('ez_session_token');
                if (token) headers['Authorization'] = `Bearer ${token}`;
            }
            return headers;
        },

        /**
         * Returns the active student/user ID across TMA, Android, or Web
         */
        getUserId() {
            // 1. Try URL search parameter if explicitly provided
            try {
                const sp = new URLSearchParams(window.location.search);
                const uidParam = sp.get('user_id');
                if (uidParam && !isNaN(Number(uidParam))) return Number(uidParam);
            } catch (e) {}

            // 2. Try global getActiveUserId from auth.js
            if (typeof getActiveUserId === 'function') {
                const id = getActiveUserId();
                if (id) return Number(id);
            }

            // 3. Try Telegram initData
            const tgId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
            if (tgId) return Number(tgId);

            // 4. Try stored profile
            try {
                const raw = localStorage.getItem('ez_user_profile');
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (parsed.id || parsed.user_id) return Number(parsed.id || parsed.user_id);
                }
            } catch (e) {}

            return 0;
        },

        /**
         * Returns saved student profile object or null
         */
        getUserProfile() {
            if (typeof getSavedUser === 'function') {
                const user = getSavedUser();
                if (user) return user;
            }
            const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
            if (tgUser) {
                return {
                    id: tgUser.id,
                    first_name: tgUser.first_name || '',
                    last_name: tgUser.last_name || '',
                    username: tgUser.username || ''
                };
            }
            return null;
        },

        /**
         * Unified Back Button Registration
         * Automatically binds to Telegram hardware back button, Capacitor App back button, or window popstate.
         */
        onBack(callback) {
            if (typeof callback !== 'function') return;

            // Telegram BackButton
            const tg = window.Telegram?.WebApp;
            if (tg && tg.BackButton) {
                try {
                    tg.BackButton.show();
                    tg.BackButton.onClick(callback);
                } catch (e) {}
            }

            // Capacitor App hardware back button
            if (window.Capacitor?.App?.addListener) {
                try {
                    window.Capacitor.App.addListener('backButton', callback);
                } catch (e) {}
            }

            // Web popstate fallback
            window.addEventListener('popstate', callback, { once: true });
        },

        /**
         * Clears Back Button listeners
         */
        clearBack() {
            const tg = window.Telegram?.WebApp;
            if (tg && tg.BackButton) {
                try {
                    tg.BackButton.hide();
                } catch (e) {}
            }
            if (window.Capacitor?.App?.removeAllListeners) {
                try {
                    window.Capacitor.App.removeAllListeners();
                } catch (e) {}
            }
        },

        /**
         * Computes safe home destination URL based on platform and parameters
         */
        getHomeUrl(dayParam = null) {
            if (typeof getPlatformHome === 'function') {
                return getPlatformHome(dayParam);
            }
            const sp = new URLSearchParams(window.location.search);
            const retUrl = sp.get('return_url');
            if (retUrl) {
                if (dayParam !== null && dayParam !== undefined && !retUrl.includes('day=')) {
                    const sep = retUrl.includes('?') ? '&' : '?';
                    return `${retUrl}${sep}day=${dayParam}`;
                }
                return retUrl;
            }
            const dayQuery = (dayParam !== null && dayParam !== undefined) ? `day=${dayParam}` : '';
            if (this.isCapacitor() || this.isTelegram()) {
                return dayQuery ? `app.html?view=day&${dayQuery}` : 'app.html?view=day';
            }
            return dayQuery ? `index.html?${dayQuery}` : 'index.html';
        },

        /**
         * Safely navigates the user back to the appropriate home screen
         */
        exitToHome(dayParam = null) {
            this.clearBack();
            window.location.href = this.getHomeUrl(dayParam);
        },

        /**
         * Opens an external link safely respecting platform sandboxing
         */
        openExternal(url) {
            if (!url) return;
            const tg = window.Telegram?.WebApp;
            if (this.isTelegram() && tg && typeof tg.openLink === 'function') {
                tg.openLink(url);
                return;
            }
            if (this.isCapacitor() && window.Capacitor?.Plugins?.Browser) {
                window.Capacitor.Plugins.Browser.open({ url: url });
                return;
            }
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    // Attach to global window object
    window.PlatformBridge = PlatformBridge;

})(window);
