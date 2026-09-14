/**
 * shell.js - Shared Layout Shell Logic
 * Ez Editorials Platform
 */

// 1. Sync Active Navigation State across Desktop Rail and Mobile Bottom Nav
function syncNavState(viewId) {
    if (!viewId) return;
    const rawName = viewId.replace('view-', '');
    
    // Update Mobile Bottom Nav
    const bottomNavItems = document.querySelectorAll('.bottom-nav .nav-item');
    bottomNavItems.forEach(item => {
        if (item.id === `nav-${rawName}`) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update Desktop Left Rail
    const railNavItems = document.querySelectorAll('.left-nav-rail .nav-rail-btn');
    railNavItems.forEach(btn => {
        if (btn.id === `rail-nav-${rawName}`) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// 2. Global Dark Mode Toggle
function toggleDarkMode() {
    const doc = document.documentElement;
    const isDark = doc.classList.toggle('dark-mode');
    if (document.body) {
        document.body.classList.toggle('dark-mode', isDark);
    }
    try {
        localStorage.setItem('app_dark_mode', isDark ? 'true' : 'false');
    } catch (e) {}

    // Update theme toggle icons if present
    const toggleBtns = document.querySelectorAll('.desktop-tool-btn, #theme-toggle-btn');
    toggleBtns.forEach(btn => {
        const span = btn.querySelector('span');
        if (span) span.innerText = isDark ? '☀️' : '🌙';
    });
}

// 3. Update Header Badges
function updateShellTargetExam(examName) {
    const el = document.getElementById('desk-target-exam-title');
    if (el && examName) {
        el.innerText = examName;
    }
}

function updateShellStreak(streakCount) {
    const el = document.getElementById('desk-streak-badge');
    if (el) {
        el.innerText = streakCount > 0 ? `${streakCount} Day Streak` : 'Streak Active';
    }
}

// 4. Modal Shell Handlers: Esc Key Dismissal & Backdrop Click
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const activeModals = document.querySelectorAll(
            '.modal-overlay, .ez-modal-overlay, [id$="ModalOverlay"], [id$="-modal"]'
        );
        for (let m of activeModals) {
            if (m && m.style.display !== 'none' && getComputedStyle(m).display !== 'none') {
                m.style.display = 'none';
                document.body.style.overflow = '';
                break;
            }
        }
    }
});

document.addEventListener('click', (e) => {
    const target = e.target;
    if (target && target.classList) {
        if (target.classList.contains('modal-overlay') || 
            target.classList.contains('ez-modal-overlay') || 
            (target.id && target.id.endsWith('ModalOverlay'))) {
            target.style.display = 'none';
            document.body.style.overflow = '';
        }
    }
});

// 5. Restore Dark Mode State on Load
(function initShellTheme() {
    try {
        if (localStorage.getItem('app_dark_mode') === 'true') {
            document.documentElement.classList.add('dark-mode');
            if (document.body) document.body.classList.add('dark-mode');
        }
    } catch (e) {}
})();

// Attach to window
window.syncNavState = syncNavState;
window.toggleDarkMode = toggleDarkMode;
window.updateShellTargetExam = updateShellTargetExam;
window.updateShellStreak = updateShellStreak;
