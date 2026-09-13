// auth.js - Unified Authentication, Session Management & Platform Adaptation for TMA, Web, and Android

const APP_VERSION = "1.0.1";

// 1. Platform Detection
function isTelegramMiniApp() {
    return Boolean(window.Telegram?.WebApp?.initData && window.Telegram.WebApp.initData.length > 0);
}

function isCapacitorApp() {
    return Boolean(window.Capacitor && (window.Capacitor.isNativePlatform?.() || window.Capacitor.platform === 'android'));
}

// Automatically tag documentElement with platform classes
(function initPlatformTags() {
    const doc = document.documentElement;
    if (isTelegramMiniApp()) {
        doc.classList.add('platform-telegram');
    } else if (isCapacitorApp()) {
        doc.classList.add('platform-capacitor', 'platform-android-app');
    } else {
        doc.classList.add('platform-web');
    }

    try {
        const ua = navigator.userAgent || '';
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
        const tgPlatform = window.Telegram?.WebApp?.platform || '';
        const isTgDesktop = ['tdesktop', 'macos', 'web', 'weba', 'webk'].includes(tgPlatform);
        const isLaptopScreen = window.innerWidth >= 1024;
        const isTablet = (window.innerWidth >= 768 && window.innerWidth < 1024) || (/iPad|Tablet|PlayBook/i.test(ua));

        if (isTgDesktop || (!isMobile && isLaptopScreen)) {
            doc.classList.add('is-desktop');
        }
        if (isTablet) {
            doc.classList.add('is-tablet');
        }
    } catch (e) {}
})();

// 2. Returns headers for Render API calls
function getAuthHeaders(customHeaders = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...customHeaders
    };
    
    if (isTelegramMiniApp()) {
        headers['X-Telegram-Init-Data'] = window.Telegram.WebApp.initData;
    } else {
        const token = localStorage.getItem('ez_session_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }
    return headers;
}

// 3. 401 Unauthorized API Interceptor
async function authFetch(url, options = {}) {
    options.headers = getAuthHeaders(options.headers || {});
    try {
        const response = await fetch(url, options);
        if (response.status === 401) {
            console.warn('[Auth] 401 Unauthorized encountered. Purging stale credentials.');
            if (!isTelegramMiniApp()) {
                localStorage.removeItem('ez_session_token');
                localStorage.removeItem('ez_user_profile');
                showLoginOverlay();
            }
        }
        return response;
    } catch (error) {
        throw error;
    }
}

// 4. Current student ID safely across TMA, Android, and Web
function getActiveUserId() {
    if (isTelegramMiniApp()) {
        const tgId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
        if (tgId) return Number(tgId);
    }
    const user = getSavedUser();
    if (user) {
        return Number(user.id || user.user_id || 0);
    }
    return 0;
}

// 5. Retrieves saved profile from localStorage
function getSavedUser() {
    try {
        const raw = localStorage.getItem('ez_user_profile');
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

// 6. Session check
function isAuthenticated() {
    if (isTelegramMiniApp()) return true;
    return Boolean(localStorage.getItem('ez_session_token'));
}

// 7. Dedicated Log Out Functionality
function logOut() {
    if (confirm("Are you sure you want to log out of Ez Editorials?")) {
        localStorage.removeItem('ez_session_token');
        localStorage.removeItem('ez_user_profile');
        sessionStorage.clear();
        
        // If inside an active test or result, route back to home
        if (window.location.pathname.includes('test.html') || window.location.pathname.includes('result.html')) {
            window.location.href = 'app.html';
            return;
        }

        showLoginOverlay();
    }
}

function showLoginOverlay() {
    const overlay = document.getElementById('externalLoginOverlay');
    if (overlay) {
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    } else {
        window.location.href = 'app.html';
    }
}

// 8. Mobile Deep-Link Login (Android App & Mobile Web)
let pollTimer = null;

async function startMobileTelegramLogin() {
    const statusEl = document.getElementById('login-status-msg');
    if (statusEl) statusEl.innerText = "Connecting to Telegram...";

    try {
        const res = await fetch('https://ez-editorials-bot.onrender.com/api/auth/request-code', {
            method: 'POST'
        });
        const data = await res.json();
        const code = data.code;
        const botUsername = data.bot_username || 'Ez_vocab_bot';

        const deepLink = `tg://resolve?domain=${botUsername}&start=login_${code}`;
        const webFallback = `https://t.me/${botUsername}?start=login_${code}`;

        window.location.href = deepLink;
        setTimeout(() => {
            window.location.href = webFallback;
        }, 1200);

        if (statusEl) statusEl.innerText = "Tap 'Start' inside Telegram, then return here...";

        clearInterval(pollTimer);
        pollTimer = setInterval(async () => {
            try {
                const checkRes = await fetch('https://ez-editorials-bot.onrender.com/api/auth/verify-code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: code })
                });
                const checkData = await checkRes.json();

                if (checkData.status === 'authenticated') {
                    clearInterval(pollTimer);
                    localStorage.setItem('ez_session_token', checkData.token);
                    localStorage.setItem('ez_user_profile', JSON.stringify(checkData.user));
                    window.location.reload();
                }
            } catch (e) {}
        }, 2000);

    } catch (err) {
        if (statusEl) statusEl.innerText = "Connection failed. Please retry.";
    }
}

// 9. Desktop Telegram Login Widget Callback
window.onTelegramAuth = async function(user) {
    const statusEl = document.getElementById('login-status-msg');
    if (statusEl) statusEl.innerText = "Verifying credentials...";

    try {
        const res = await fetch('https://ez-editorials-bot.onrender.com/api/auth/telegram-widget', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });
        const data = await res.json();

        if (res.status === 200 && data.token) {
            localStorage.setItem('ez_session_token', data.token);
            localStorage.setItem('ez_user_profile', JSON.stringify(data.user));
            window.location.reload();
        } else {
            alert(data.error || "Login verification failed.");
        }
    } catch (e) {
        alert("Failed to connect to authentication server.");
    }
};

// 10. Auto-Mount Login Screen if Unauthenticated
window.addEventListener('DOMContentLoaded', () => {
    if (!isAuthenticated()) {
        const overlay = document.getElementById('externalLoginOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }
    
    // Mount offline / online listeners
    setupNetworkListeners();

    // Setup native Android back-button
    setupAndroidBackButton();

    // Check version update in Capacitor Android app
    if (isCapacitorApp()) {
        checkAppUpdate();
    }
});

// 11. Offline Detection Banner
function setupNetworkListeners() {
    let offlineBanner = document.getElementById('ez-offline-banner');
    if (!offlineBanner) {
        offlineBanner = document.createElement('div');
        offlineBanner.id = 'ez-offline-banner';
        offlineBanner.innerHTML = '⚠️ No Internet Connection. Check your network.';
        offlineBanner.style.cssText = 'position:fixed; top:0; left:0; right:0; background:#ef4444; color:#ffffff; text-align:center; padding:9px 14px; font-size:13px; font-weight:600; z-index:999999; display:none; box-shadow:0 2px 8px rgba(0,0,0,0.2);';
        document.body.appendChild(offlineBanner);
    }

    window.addEventListener('offline', () => {
        offlineBanner.style.display = 'block';
    });

    window.addEventListener('online', () => {
        offlineBanner.style.background = '#10b981';
        offlineBanner.innerHTML = '✅ Internet Connection Restored!';
        setTimeout(() => {
            offlineBanner.style.display = 'none';
            offlineBanner.style.background = '#ef4444';
            offlineBanner.innerHTML = '⚠️ No Internet Connection. Check your network.';
        }, 2200);
    });
}

// 12. Native Android Hardware Back Button Handling (Capacitor)
let lastBackPressTime = 0;
let isBackButtonListenerAttached = false;

function setupAndroidBackButton() {
    const CapApp = window.Capacitor?.Plugins?.App;
    if (!CapApp || typeof CapApp.addListener !== 'function' || isBackButtonListenerAttached) return;
    
    isBackButtonListenerAttached = true;
    CapApp.addListener('backButton', () => {
        // Priority 1: Dismiss active modal overlays & restore scroll
        const activeModals = document.querySelectorAll(
            '.modal-overlay, [id$="ModalOverlay"], [id$="-modal"]'
        );
        let dismissedModal = false;
        for (let m of activeModals) {
            if (m && m.style.display !== 'none' && getComputedStyle(m).display !== 'none') {
                m.style.display = 'none';
                dismissedModal = true;
            }
        }
        if (dismissedModal) {
            document.body.style.overflow = '';
            return;
        }

        // Priority 2: Confirm before aborting an active test
        if (window.location.pathname.includes('test.html')) {
            if (confirm("Are you sure you want to exit? Responses recorded so far will be submitted.")) {
                window.location.href = 'app.html?view=day';
            }
            return;
        }

        // Priority 3: On result.html, navigate back to daily trials
        if (window.location.pathname.includes('result.html')) {
            if (typeof goBackToTopics === 'function') {
                goBackToTopics();
            } else {
                window.location.href = 'app.html?view=day';
            }
            return;
        }

        // Priority 4: Navigate from Sub-views back to Home
        const homeView = document.getElementById('view-home');
        if (homeView && typeof switchView === 'function' && !homeView.classList.contains('active')) {
            switchView('view-home');
            return;
        }

        // Priority 5: Double-tap on Home screen to exit app
        const now = Date.now();
        if (now - lastBackPressTime < 2000) {
            CapApp.exitApp();
        } else {
            lastBackPressTime = now;
            showToast("Press back again to exit");
        }
    });
}

// Attach immediately if Capacitor is already ready
if (window.Capacitor?.Plugins?.App) {
    setupAndroidBackButton();
}

// 13. Toast notification utility
function showToast(msg) {
    let toast = document.getElementById('ez-app-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'ez-app-toast';
        toast.style.cssText = 'position:fixed; bottom:80px; left:50%; transform:translateX(-50%); background:rgba(26,26,26,0.92); color:#fff; padding:10px 20px; border-radius:24px; font-size:13px; font-weight:600; z-index:999999; box-shadow:0 4px 14px rgba(0,0,0,0.3); pointer-events:none; transition:opacity 0.25s ease;';
        document.body.appendChild(toast);
    }
    toast.innerText = msg;
    toast.style.opacity = '1';
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => { toast.style.display = 'none'; }, 250);
    }, 1800);
}

// 14. In-App Version / Update Checker for direct APK distribution
async function checkAppUpdate() {
    try {
        const res = await fetch('https://ez-editorials-bot.onrender.com/api/system-status');
        const data = await res.json();
        if (data.latest_version && data.latest_version !== APP_VERSION) {
            showUpdateModal(data.latest_version, data.download_url || 'https://t.me/ezeditorialgroup');
        }
    } catch (e) {}
}

function showUpdateModal(newVersion, downloadUrl) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:999999; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:#fff; border-radius:18px; padding:24px; max-width:380px; width:100%; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.4);">
            <div style="font-size:44px; margin-bottom:12px;">🚀</div>
            <h3 style="margin:0 0 8px; font-size:18px; color:#111827; font-weight:700;">Update Available!</h3>
            <p style="font-size:13px; color:#6b7280; line-height:1.5; margin-bottom:20px;">
                A newer version (v${newVersion}) of Ez Editorials is now available with performance improvements and updates.
            </p>
            <div style="display:flex; gap:10px;">
                <button onclick="this.closest('div').parentElement.parentElement.remove()" style="flex:1; padding:11px; border-radius:10px; border:1px solid #e5e7eb; background:#f9fafb; color:#374151; font-weight:600; cursor:pointer;">Later</button>
                <a href="${downloadUrl}" target="_blank" style="flex:1.2; text-decoration:none; padding:11px; border-radius:10px; border:none; background:#e73b50; color:#fff; font-weight:700; display:flex; align-items:center; justify-content:center;">Download</a>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// 15. Clear Cache Utility
function clearAppCache() {
    if (confirm("Clear cached test data and refresh the app?")) {
        sessionStorage.clear();
        const keysToKeep = ['ez_session_token', 'ez_user_profile', 'app_dark_mode', 'app_vibration'];
        const saved = {};
        keysToKeep.forEach(k => { saved[k] = localStorage.getItem(k); });
        localStorage.clear();
        keysToKeep.forEach(k => { if (saved[k] !== null) localStorage.setItem(k, saved[k]); });
        
        showToast("Cache cleared successfully! Reloading...");
        setTimeout(() => { window.location.reload(); }, 600);
    }
}

// 16. Google Play Compliance: Account Deletion
async function deleteAccount() {
    const confirmation = prompt("⚠️ WARNING: This will permanently delete your Ez Editorials account, test attempts, streaks, and all personal data. This action cannot be undone.\n\nType 'DELETE' to confirm:");
    if (confirmation !== 'DELETE') {
        if (confirmation !== null) alert("Account deletion cancelled. Confirmation word did not match.");
        return;
    }

    try {
        const res = await authFetch('https://ez-editorials-bot.onrender.com/api/user/delete-account', {
            method: 'POST'
        });
        const data = await res.json();
        if (data.success) {
            alert("Your account and all associated data have been permanently wiped.");
            localStorage.clear();
            sessionStorage.clear();
            window.location.reload();
        } else {
            alert("Failed to delete account: " + (data.error || "Unknown server error"));
        }
    } catch(e) {
        alert("Failed to reach server. Please check your network.");
    }
}
