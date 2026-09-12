// auth.js - Unified Authentication for TMA, Web, and Android

const isTMA = Boolean(window.Telegram?.WebApp?.initData && window.Telegram.WebApp.initData.length > 0);

// 1. Returns headers for Render API calls
function getAuthHeaders() {
    if (isTMA) {
        return {
            'Content-Type': 'application/json',
            'X-Telegram-Init-Data': window.Telegram.WebApp.initData
        };
    }
    const token = localStorage.getItem('ez_session_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

// 2. Returns current student ID
function getActiveUserId() {
    if (isTMA) {
        return window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 0;
    }
    const user = getSavedUser();
    return user ? user.id : 0;
}

// 3. Retrieves saved profile from localStorage
function getSavedUser() {
    try {
        const raw = localStorage.getItem('ez_user_profile');
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

// 4. Session check
function isAuthenticated() {
    if (isTMA) return true;
    return Boolean(localStorage.getItem('ez_session_token'));
}

// 5. Mobile Deep-Link Login (Android App & Mobile Web)
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

        // Direct student into bot with authentication payload
        const deepLink = `tg://resolve?domain=${botUsername}&start=login_${code}`;
        const webFallback = `https://t.me/${botUsername}?start=login_${code}`;

        // Attempt app protocol first; fallback to browser link
        window.location.href = deepLink;
        setTimeout(() => {
            window.location.href = webFallback;
        }, 1200);

        if (statusEl) statusEl.innerText = "Tap 'Start' inside Telegram, then return here...";

        // Poll Render until the bot records the user
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

// 6. Desktop Telegram Login Widget Callback
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

// 7. Auto-Mount Login Screen if Unauthenticated
window.addEventListener('DOMContentLoaded', () => {
    if (!isAuthenticated()) {
        const overlay = document.getElementById('externalLoginOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }
});
