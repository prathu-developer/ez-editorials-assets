const tg = window.Telegram.WebApp;
tg.expand();
tg.setHeaderColor('#1e3c72');
tg.setBackgroundColor('#f4f6f8');

const userId = tg.initDataUnsafe?.user?.id || 0;
let globalData = [];
let dailyChartInstance = null;
let pieChartInstance = null;

function getLeagueBadgeHTML(tier) {
    const leagues = [
        { name: 'Unranked', class: 'bg-unranked', icon: '🛡️' }, 
        { name: 'Bronze', class: 'bg-bronze', icon: '🥉' },      
        { name: 'Silver', class: 'bg-silver', icon: '🥈' },      
        { name: 'Gold', class: 'bg-gold', icon: '🥇' },          
        { name: 'Platinum', class: 'bg-plat', icon: '💠' },      
        { name: 'Diamond', class: 'bg-dia', icon: '💎' },        
        { name: 'Champion', class: 'bg-champ', icon: '👑' },     
        { name: 'Master', class: 'bg-master', icon: '🎖️' },      
        { name: 'Elite', class: 'bg-elite', icon: '⚡' },        
        { name: 'Legend', class: 'bg-legend', icon: '🌟' },      
        { name: 'Mythic', class: 'bg-mythic', icon: '🔮' },      
        { name: 'Prodigy', class: 'bg-prodigy', icon: '⚛️' },    
        { name: 'Celestial', class: 'bg-celestial', icon: '☄️' },
        { name: 'Zenith', class: 'bg-zenith', icon: '🧿' },      
        { name: 'Ascendant', class: 'bg-ascendant', icon: '🌌' }, 
        { name: 'Omniscient', class: 'bg-omniscient', icon: '👁️‍🗨️' }, 
        { name: 'Genesis I', class: 'bg-genesis', icon: '✨' }, 
        { name: 'Genesis II', class: 'bg-genesis', icon: '✨' }, 
        { name: 'Genesis III', class: 'bg-genesis', icon: '✨' }, 
        { name: 'Genesis IV', class: 'bg-genesis', icon: '✨' }, 
        { name: 'Genesis V', class: 'bg-genesis', icon: '✨' },  
        { name: 'Genesis VI', class: 'bg-genesis', icon: '✨' }, 
        { name: 'Genesis VII', class: 'bg-genesis', icon: '✨' },
        { name: 'Genesis VIII', class: 'bg-genesis', icon: '✨' },
        { name: 'Genesis IX', class: 'bg-genesis', icon: '✨' }, 
        { name: 'Genesis X', class: 'bg-genesis', icon: '👑' }   
    ];
    let l = leagues[tier] || leagues[0];
    return `<span class="league-badge ${l.class}">${l.icon} ${l.name}</span>`;
}

function getLeagueBgClass(tier, type='row') {
    const classes = [
        'unranked', 'bronze', 'silver', 'gold', 'plat', 'dia', 'champ',
        'master', 'elite', 'legend', 'mythic', 'prodigy', 'celestial', 'zenith', 'ascendant',
        'omniscient', 'genesis', 'genesis', 'genesis', 'genesis', 'genesis',
        'genesis', 'genesis', 'genesis', 'genesis', 'genesis'
    ];
    let base = classes[tier] || classes[0];
    return type === 'row' ? `row-bg-${base}` : `mod-bg-${base}`;
}

function getLeagueFooterColor(tier) {
    const colors = [
        'rgba(255, 255, 255, 0.98)', 'rgba(255, 247, 237, 0.98)', 'rgba(248, 250, 252, 0.98)',
        'rgba(254, 252, 232, 0.98)', 'rgba(240, 249, 255, 0.98)', 'rgba(250, 245, 255, 0.98)',
        'rgba(254, 242, 242, 0.98)', 'rgba(240, 253, 244, 0.98)', 'rgba(255, 241, 242, 0.98)',
        'rgba(253, 242, 248, 0.98)', 'rgba(236, 254, 255, 0.98)', 'rgba(253, 244, 255, 0.98)',
        'rgba(239, 246, 255, 0.98)', 'rgba(250, 250, 250, 0.98)', 'rgba(245, 243, 255, 0.98)',
        'rgba(254, 252, 232, 0.98)', 
        'rgba(253, 244, 255, 0.98)', 'rgba(253, 244, 255, 0.98)', 'rgba(253, 244, 255, 0.98)', 
        'rgba(253, 244, 255, 0.98)', 'rgba(253, 244, 255, 0.98)', 'rgba(253, 244, 255, 0.98)',
        'rgba(253, 244, 255, 0.98)', 'rgba(253, 244, 255, 0.98)', 'rgba(253, 244, 255, 0.98)', 'rgba(253, 244, 255, 0.98)'
    ];
    return colors[tier] || colors[0];
}

function getAcademicTitle(elo) {
    if (elo >= 2000) return '🎓 Valedictorian';
    if (elo >= 1800) return '🏅 Laureate';
    if (elo >= 1600) return '✒️ Philologist';
    if (elo >= 1400) return '📖 Lexicologist';
    if (elo >= 1200) return '🏛️ Grammarian';
    if (elo >= 1000) return '🎓 Scholar';
    if (elo >= 900) return '📝 Aspirant';
    return '📘 Initiate';
}

function scrollToDemotionZone() {
    const demotionLine = document.getElementById('demotionZoneLine');
    if (demotionLine) {
        demotionLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        if (window.Telegram?.WebApp?.showAlert) {
            window.Telegram.WebApp.showAlert("No active members inside the Demotion Zone line yet!");
        } else {
            alert("No active members inside the Demotion Zone line yet!");
        }
    }
}

function renderLeaderboardData(data) {
    if (document.getElementById('weekNumber')) document.getElementById('weekNumber').innerText = data.current_week;
    if (document.getElementById('activeCount')) document.getElementById('activeCount').innerText = data.total_active || data.leaderboard.length;

    window.totalQuizzesAvailable = data.total_quizzes || 0;
    window.topperHistory = data.topper_history;
    window.classAvgHistory = data.class_avg_history;

    // --- SAFETY NET ---
    window.currentUserData = data.current_user || {
        id: null, name: "You", score: 0, rank: "N/A", league: 0,
        history: { accuracy: 0, correct: 0, wrong: 0 }
    };
    const me = window.currentUserData;

    const listDiv = document.getElementById('list');
    listDiv.innerHTML = '';
    globalData = data.leaderboard;
    let targetAverage = data.target_average || 0;

    // 1. DYNAMIC MATH: Update "Overtake" and "Promotion Zone" texts
    const heroCard = document.querySelector('.cup-hero-card');
    if (heroCard && globalData.length > 0) {
        let myIndex = globalData.findIndex(u => u.id === me.id);
        
        // Calculate points to overtake the person above
        if (myIndex > 0) {
            let targetUser = globalData[myIndex - 1];
            let diff = (targetUser.score - me.score).toFixed(2);
            let overtakeTextEl = heroCard.querySelector('span[style*="overtake"]');
            if (overtakeTextEl) overtakeTextEl.innerText = `${diff} pts to overtake #${targetUser.rank} ›`;
        }
        
        // Calculate places to go for the Promotion Zone
        const promoBanner = document.querySelector('.promo-banner');
        if (promoBanner && myIndex !== -1) {
            let cutoffIndex = globalData.findIndex(u => u.score < targetAverage);
            if (cutoffIndex === -1) cutoffIndex = globalData.length;
            
            let placesToGoEl = promoBanner.querySelector('span[style*="#059669"]');
            if (placesToGoEl) {
                let places = myIndex - cutoffIndex + 1;
                placesToGoEl.innerText = places > 0 ? `${places} places to go` : `Safely in zone!`;
            }
        }
    }

    // 2. RENDER "BATTLE AROUND YOU"
    const battleContainer = document.getElementById('battle-around-you-container');
    if (battleContainer && globalData.length > 0) {
        let myIndex = globalData.findIndex(u => u.id === me.id);
        if (myIndex === -1) myIndex = globalData.length - 1; 
        
        let startIdx = Math.max(0, myIndex - 1);
        let endIdx = Math.min(globalData.length - 1, myIndex + 1);
        
        // Always try to show 3 boxes if possible
        if (myIndex === 0 && globalData.length > 2) endIdx = 2;
        if (myIndex === globalData.length - 1 && globalData.length > 2) startIdx = globalData.length - 3;

        let battleHtml = "";
        for (let i = startIdx; i <= endIdx; i++) {
            let u = globalData[i];
            let isMe = (u.id === me.id);
            let iconHtml = "", diffText = "";
            
            if (isMe) {
                iconHtml = `<div style="font-size: 13px; font-weight: 800; color: var(--brand); margin-bottom: 2px;">#${u.rank}</div>`;
                diffText = `<div style="font-size: 13px; font-weight: 700; color: var(--brand);">${(u.score % 1 !== 0 ? u.score.toFixed(2) : u.score)} pts</div>`;
            } else if (i < myIndex) {
                iconHtml = `<div style="color: var(--danger); font-size: 16px; font-weight: 900; margin-bottom: 2px;">↑</div><div style="font-size: 11px; color: var(--text-muted); font-weight: 600; margin-bottom: 2px;">#${u.rank}</div>`;
                diffText = `<div style="font-size: 11px; color: var(--danger); font-weight: 600; margin-top: 2px;">-${(u.score - me.score).toFixed(2)} pts</div>`;
            } else {
                iconHtml = `<div style="color: var(--success); font-size: 16px; font-weight: 900; margin-bottom: 2px;">↓</div><div style="font-size: 11px; color: var(--text-muted); font-weight: 600; margin-bottom: 2px;">#${u.rank}</div>`;
                diffText = `<div style="font-size: 11px; color: var(--success); font-weight: 600; margin-top: 2px;">+${(me.score - u.score).toFixed(2)} pts</div>`;
            }
            
            let activeClass = isMe ? "active" : "";
            let nameDisplay = isMe ? "You" : u.name.split(' ')[0];
            
            battleHtml += `
                <div class="battle-item ${activeClass}" onclick="openProfile(${u.id})">
                    ${iconHtml}
                    <div style="font-size: 13px; font-weight: 700; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 80px; margin: 0 auto;">${nameDisplay}</div>
                    ${diffText}
                </div>
            `;
            
            if (i < endIdx) battleHtml += `<div style="border-top: 2px dashed var(--border-light); width: 16px;"></div>`;
        }
        battleContainer.innerHTML = battleHtml;
    }

    // 3. RENDER TOPPERS (Podium + List)
    let htmlBuffer = "";
    let insertedPromoDivider = false;
    let insertedDemoDivider = false;

    // Podium (Top 3 Cards)
    if (globalData.length > 0) {
        htmlBuffer += `<div class="podium-container">`;
        let podiumOrder = [];
        if (globalData.length >= 2) podiumOrder.push(globalData[1]); // Rank 2 on left
        if (globalData.length >= 1) podiumOrder.push(globalData[0]); // Rank 1 in middle
        if (globalData.length >= 3) podiumOrder.push(globalData[2]); // Rank 3 on right
        
        podiumOrder.forEach(u => {
            let isMe = u.id === me.id;
            let rankClass = `rank-${u.rank}`;
            let medal = u.rank === 1 ? '🥇' : u.rank === 2 ? '🥈' : '🥉';
            let initial = u.name.charAt(0).toUpperCase();
            let scoreDisplay = u.score % 1 !== 0 ? u.score.toFixed(2) : u.score;
            
            htmlBuffer += `
                <div class="podium-card ${rankClass}" onclick="openProfile(${u.id})">
                    <div class="podium-medal">${medal}</div>
                    <div class="podium-avatar">${initial}</div>
                    <div style="font-size: 12px; font-weight: 800; color: var(--text-main); margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${isMe ? 'You' : u.name.split(' ')[0]}</div>
                    ${getLeagueBadgeHTML(u.league)}
                    <div style="font-size: 14px; font-weight: 900; color: var(--brand); margin-top: 8px;">${scoreDisplay} pts</div>
                </div>
            `;
        });
        htmlBuffer += `</div>`;
    }

    // Remaining List (Rank 4 onwards)
    globalData.slice(3).forEach((user, index) => {
        let isDemotion = user.score < targetAverage;

        if (!insertedPromoDivider && user.score >= targetAverage) {
            htmlBuffer += `
                <div style="display: flex; align-items: center; margin: 10px 0 20px 0;">
                    <div style="flex: 1; height: 1px; background: linear-gradient(90deg, transparent, #10b981);"></div>
                    <div style="padding: 4px 12px; font-size: 10px; font-weight: 800; color: #10b981; background: #d1fae5; border-radius: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 8px;">
                        ▲ PROMOTION ZONE ▲
                    </div>
                    <div style="flex: 1; height: 1px; background: linear-gradient(270deg, transparent, #10b981);"></div>
                </div>
            `;
            insertedPromoDivider = true;
        }

        if (!insertedDemoDivider && user.score < targetAverage) {
            htmlBuffer += `
                <div id="demotionZoneLine" style="display: flex; align-items: center; margin: 20px 0 15px 0;">
                    <div style="flex: 1; height: 1px; background: linear-gradient(90deg, transparent, #ef4444);"></div>
                    <div style="padding: 4px 12px; font-size: 10px; font-weight: 800; color: #ef4444; background: #fee2e2; border-radius: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 8px;">
                        ▼ DEMOTION ZONE ▼
                    </div>
                    <div style="flex: 1; height: 1px; background: linear-gradient(270deg, transparent, #ef4444);"></div>
                </div>
            `;
            insertedDemoDivider = true;
        }

        let isMe = (user.id === me.id);
        let displayName = isMe ? `<span style="font-weight: 900; color: var(--brand);">You</span>` : user.name;
        let meHighlightStyle = isMe ? `border: 1px solid var(--brand); box-shadow: 0 0 10px rgba(90, 50, 250, 0.15);` : ``;
        let rowBgClass = getLeagueBgClass(user.league, 'row');
        let scoreDisplay = user.score % 1 !== 0 ? user.score.toFixed(2) : user.score;

        htmlBuffer += `
            <div class="rank-row ${rowBgClass}" onclick="openProfile(${user.id})" style="cursor: pointer; ${meHighlightStyle} animation-delay: ${index * 0.04}s;">
                <div class="rank-left">
                    <div class="rank-number" style="font-size: 14px;">#${user.rank}</div>
                    <div class="user-details">
                        <div class="user-name">${displayName}</div>
                        <div class="user-sub-details">
                            ${getLeagueBadgeHTML(user.league)}
                        </div>
                    </div>
                </div>
                <div class="user-score" style="background: transparent; color: var(--text-main); font-weight: 800;">${scoreDisplay}</div>
            </div>
        `;
    });

    listDiv.innerHTML = htmlBuffer;
}

const cacheKey = 'quizCupData_' + userId;
const cachedString = localStorage.getItem(cacheKey);
if (cachedString) {
    try {
        renderLeaderboardData(JSON.parse(cachedString));
    } catch (e) { console.error("Cache read error", e); }
}

fetch(`https://ez-editorials-bot.onrender.com/api/leaderboard?user_id=${userId}`, {
    headers: { 'X-Telegram-Init-Data': window.Telegram.WebApp.initData } // ✨ SECURE AUTH HEADER
})
    .then(response => response.json())
    .then(data => {
        if (data.locked || data.error) {
            console.log("Server is syncing. Using cached data.");
            return;
        }

        const tgUserId = Number(tg.initDataUnsafe?.user?.id) || 0;
        const ADMIN_IDS = [716496729, 5103843488, 6251430317];
        const isAdmin = ADMIN_IDS.includes(tgUserId);

        // ✨ FIX: Single declaration preserving the server's rich current_user object
        const myPersonalData = data.current_user || {
            id: tgUserId,
            name: "You",
            score: 0,
            rank: "N/A",
            league: 0,
            house: "🏳️ Unsorted",
            is_captain: 0,
            elo: 1000,
            attempts: 0,
            lifetime_growth: "Calibrating...",
            rank_history: [],
            history: { labels: [], scores: [], accuracy: 0, correct: 0, wrong: 0 }
        };

        myPersonalData.is_admin = isAdmin;
        data.current_user = myPersonalData; 

        localStorage.setItem(cacheKey, JSON.stringify(data));
        renderLeaderboardData(data);
    })
    .catch(err => {
        if(!cachedString) {
            document.getElementById('list').innerHTML = '<div style="text-align: center; color: #ef4444; margin-top: 30px;">Network error. Cannot connect to the Great Hall.</div>';
        }
    });

function updateTimer() {
    let now = new Date();
    let target = new Date();
    target.setDate(now.getDate() + (7 - now.getDay()) % 7);
    target.setHours(23, 59, 59, 0);

    let diff = target - now;
    if (diff < 0) {
        target.setDate(target.getDate() + 7);
        diff = target - now;
    }

    let d = Math.floor(diff / (1000 * 60 * 60 * 24));
    let h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    let m = Math.floor((diff / (1000 * 60)) % 60);

    let timeText = d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`;
    document.getElementById('timeRemainingHead').innerText = timeText;
}
setInterval(updateTimer, 60000);
updateTimer();

function calculateStats(score) {
    let bestC = 0, bestW = 0;
    if (score > 0) {
        for(let c = 25; c >= 0; c--) {
            let w = (c * 4) - score;
            if(w >= 0 && (c + w) <= 25) {
                bestC = c;
                bestW = w;
                break;
            }
        }
    } else if (score < 0) {
        bestW = Math.abs(score);
    }

    let attempts = bestC + bestW;
    let accuracy = attempts > 0 ? Math.round((bestC / attempts) * 100) : 0;
    return { correct: bestC, wrong: bestW, attempts: attempts, accuracy: accuracy, score: score };
}

function renderRankHistory(targetUser) {
    const container = document.getElementById('rankHistorySection');
    container.innerHTML = '';

    if (!targetUser.rank_history || targetUser.rank_history.length === 0) {
        container.innerHTML = `<div style="text-align:center; color:#94a3b8; padding: 10px; font-size: 0.85em;">No previous week data recorded yet. Entry tracker will update from next week! 🔮</div>`;
        return;
    }

    targetUser.rank_history.slice(0, 5).forEach((entry, idx) => {
        let statusBadge = idx === 0 ? `<span class="league-badge bg-gold" style="font-size:0.6em; padding:2px 4px; margin-left:8px;">Previous Week</span>` : '';

        // Extract variables safely
        let score = entry.score || 0;
        let att = entry.attempts || 0;
        let cor = entry.correct || 0;
        let total = entry.total || 0; 
        let rank = entry.rank || '-';
        let week = entry.week || '-';

        // 🟢 FIX: Wrap all arguments in quotes to prevent JS syntax breaks
        let clickAction = `onclick="openHistoryDetail('${week}', '${rank}', '${total}', '${score}', '${att}', '${cor}')"`;
        
        container.innerHTML += `
            <div class="activity-row" ${clickAction} style="align-items: center; cursor: pointer; padding: 12px 10px; border-radius: 8px; margin-bottom: 5px; background: white; border: 1px solid #f1f5f9; box-shadow: 0 1px 2px rgba(0,0,0,0.02); transition: transform 0.1s;">
                <div class="act-day" style="width: auto; font-weight: 600; color: #0f172a;">Week ${week} ${statusBadge}</div>
                <div style="display:flex; align-items:center; gap: 12px;">
                    <div class="text-blue" style="font-weight: 700; font-size: 1.05em;">
                        #${rank} <span style="font-size: 0.75em; color: #64748b; font-weight: normal;">/ ${total}</span>
                    </div>
                    <div style="color: #cbd5e1; font-weight: bold; font-size: 1.2em;">➔</div>
                </div>
            </div>
        `;
    });
}

function closeModal(event, force=false) {
    if (force || event.target.id === 'analysisModal') {
        document.getElementById('analysisModal').classList.remove('active');
    }
}

async function openProfile(targetId) {
    let isOwnProfile = (targetId === window.currentUserData.id);

    if (!isOwnProfile && !window.currentUserData.is_admin) {
        if (window.Telegram?.WebApp?.showAlert) {
            window.Telegram.WebApp.showAlert("🔒 Only Admins can view other students' detailed analysis.");
        } else {
            alert("🔒 Only Admins can view other students' detailed analysis.");
        }
        return; 
    }

    let targetUser;
    if (isOwnProfile) {
        targetUser = window.currentUserData;
    } else {
        try {
            // Fetch detailed profile for other students (Admin only)
            // Shows loading state before overwriting
            document.getElementById('modalStudentName').innerText = "Loading data...";
            const response = await fetch(`https://ez-editorials-bot.onrender.com/api/profile/${targetId}`);
            if (!response.ok) throw new Error("Endpoint not found");
            targetUser = await response.json();
        } catch (error) {
            console.error("Failed to load user profile:", error);
            if (window.Telegram?.WebApp?.showAlert) {
                window.Telegram.WebApp.showAlert("⚠️ Could not load student's detailed profile. The backend endpoint may not be ready.");
            }
            return;
        }
    }

    if (!targetUser) return;

    const modalContent = document.getElementById('modalContentBg');
    modalContent.className = 'modal-content';
    modalContent.classList.add(getLeagueBgClass(targetUser.league, 'mod'));

    document.getElementById('modalStudentName').innerHTML = targetUser.name;

    let leagueBadge = getLeagueBadgeHTML(targetUser.league);
    document.getElementById('modalStudentHouse').innerHTML = `${leagueBadge}`;
    document.getElementById('modalStudentElo').innerText = `🧠 ${targetUser.elo ? Math.round(targetUser.elo) : 1000}`;
    document.getElementById('modalStudentTitle').innerText = getAcademicTitle(targetUser.elo || 1000);

    document.getElementById('statScore').innerText = targetUser.score % 1 !== 0 ? targetUser.score.toFixed(2) : targetUser.score;
    document.getElementById('statAccuracy').innerText = targetUser.history.accuracy + '%';

    let totalAttempts = targetUser.history.correct + targetUser.history.wrong;
    let maxAvailable = window.totalQuizzesAvailable || 0;
    
    if (totalAttempts > maxAvailable) maxAvailable = totalAttempts;

    document.getElementById('statAttempts').innerText = `${totalAttempts} / ${maxAvailable}`;

    let growthText = targetUser.lifetime_growth || "Calibrating...";
    let growthElement = document.getElementById('statGrowth');
    
    growthElement.innerText = growthText;
    
    if (growthText.includes('+')) {
        growthElement.style.fontSize = "1.8em";
    } else {
        growthElement.style.fontSize = "1.3em";
    }
    
    document.getElementById('tblStudentHeader').innerText = isOwnProfile ? 'You' : targetUser.name.split(' ')[0];

    // Safely extract from either 'history' (own profile) or 'performance' (other profile API)
    let userAtt = totalAttempts;
    let userAcc = targetUser.history?.accuracy ?? targetUser.performance?.accuracy ?? 0;
    let userCor = targetUser.history?.correct ?? Math.round((userAcc / 100) * userAtt) ?? 0;
    let userWro = targetUser.history?.wrong ?? Math.max(0, userAtt - userCor);

    document.getElementById('tblYouCor').innerHTML = `${userCor} <span style="font-size:0.8em; color:#64748b;">(${userAcc}%)</span>`;
    document.getElementById('tblYouWro').innerHTML = `${userWro} <span style="font-size:0.8em; color:#64748b;">(${userAtt > 0 ? 100 - userAcc : 0}%)</span>`;
    document.getElementById('tblYouAtt').innerText = userAtt;
    document.getElementById('tblYouAcc').innerText = userAcc + '%';

    // Omit Topper/Class Averages safely since lightweight leaderboard lacks history
    ['tblTopCor', 'tblTopWro', 'tblTopAtt', 'tblTopAcc', 'tblAvgCor', 'tblAvgWro', 'tblAvgAtt', 'tblAvgAcc'].forEach(id => {
        let el = document.getElementById(id);
        if (el) el.innerText = '—';
    });

    let topper = globalData && globalData.length > 0 ? globalData[0] : targetUser;
    let topperName = topper.name || "Student";
    let topperScore = topper.score || 0;
    document.getElementById('bannerTopperName').innerHTML = topperName;
    document.getElementById('bannerTopperInfo').innerText = `${topperScore % 1 !== 0 ? topperScore.toFixed(2) : topperScore} pts`;

    document.getElementById('csTotal').innerText = targetUser.score % 1 !== 0 ? targetUser.score.toFixed(2) : targetUser.score;
    document.getElementById('csCorrect').innerText = targetUser.history.correct;
    document.getElementById('csWrong').innerText = targetUser.history.wrong;
    document.getElementById('csAcc').innerText = targetUser.history.accuracy + '%';

    renderRankHistory(targetUser);
    populateRecentActivity(targetUser);
    renderCharts(targetUser);

    const modal = document.getElementById('analysisModal');
    modal.classList.add('active');
}

function populateRecentActivity(targetUser) {
    const actList = document.getElementById('activityList');
    actList.innerHTML = '';

    let labels = targetUser.history.labels;
    let scores = targetUser.history.scores;
    let dailyCorrect = targetUser.history.daily_correct || [];
    let dailyAttempts = targetUser.history.daily_attempts || [];

    if (!labels || labels.length === 0) {
        actList.innerHTML = '<div style="text-align:center; color:#94a3b8; padding: 10px;">No quizzes attempted yet.</div>';
        return;
    }

    const weekOrder = { 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 7 };
    let activities = [];
    for (let i = 0; i < labels.length; i++) {
        activities.push({
            day: labels[i],
            score: scores[i],
            correct: dailyCorrect[i] || 0,
            wrong: Math.max(0, (dailyAttempts[i] || 0) - (dailyCorrect[i] || 0)),
            order: weekOrder[labels[i]] || 0
        });
    }
    activities.sort((a, b) => b.order - a.order);

    activities.forEach(act => {
        if (act.score === 0 && act.correct === 0 && act.wrong === 0) return;

        actList.innerHTML += `
            <div class="activity-row">
                <div class="act-day">${act.day}</div>
                <div class="act-stats">
                    <span class="text-green">✅ ${act.correct}</span>
                    <span class="text-red">❌ ${act.wrong}</span>
                </div>
                <div class="text-blue" style="font-weight:700;">${act.score > 0 ? '+' : ''}${act.score % 1 !== 0 ? act.score.toFixed(2) : act.score} pts</div>
            </div>
        `;
    });

    if (actList.innerHTML === '') {
        actList.innerHTML = '<div style="text-align:center; color:#94a3b8; padding: 10px;">No quizzes attempted yet.</div>';
    }
}

function openHistoryDetail(week, rank, total, score, attempts, correct) {
    // 🟢 FIX: Parse the stringified arguments back to numbers safely
    score = parseFloat(score) || 0;
    attempts = parseInt(attempts) || 0;
    correct = parseInt(correct) || 0;

    let acc = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;

    document.getElementById('histWeek').innerText = week;
    document.getElementById('histRank').innerText = `#${rank}`;
    document.getElementById('histScore').innerText = (score % 1 !== 0 ? score.toFixed(2) : score);
    document.getElementById('histAcc').innerText = acc + '%';
    document.getElementById('histCorrect').innerText = correct;

    document.getElementById('historyModalOverlay').style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Lock scrolling
}

function closeHistoryModal(event, force=false) {
    if (force || event.target.id === 'historyModalOverlay') {
        document.getElementById('historyModalOverlay').style.display = 'none';
        document.body.style.overflow = ''; // Unlock scrolling
    }
}

function renderCharts(targetUser) {
    const ctxDaily = document.getElementById('dailyChart').getContext('2d');
    const ctxPie = document.getElementById('pieChart').getContext('2d');

    if (dailyChartInstance) dailyChartInstance.destroy();
    if (pieChartInstance) pieChartInstance.destroy();

    const weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    let finalYou = [null, null, null, null, null, null, null];
    let finalTop = [null, null, null, null, null, null, null];
    let finalAvg = [null, null, null, null, null, null, null];

    let now = new Date();
    let utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    let istTime = new Date(utc + (330 * 60000));
    let day = istTime.getDay();
    let currentDayIndex = day === 0 ? 6 : day - 1; 

    for (let i = 0; i < targetUser.history.labels.length; i++) {
        let dayIndex = weekLabels.indexOf(targetUser.history.labels[i]);
        if (dayIndex !== -1 && dayIndex <= currentDayIndex) {
            finalYou[dayIndex] = targetUser.history.scores[i];
        }
    }

    for (let i = 0; i <= currentDayIndex; i++) {
        if (finalYou[i] === null) finalYou[i] = 0;
        finalTop[i] = window.topperHistory[weekLabels[i]] || 0;
        finalAvg[i] = window.classAvgHistory[weekLabels[i]] || 0;
    }

    let myLabel = targetUser.id === window.currentUserData.id ? 'You' : targetUser.name.split(' ')[0];

    dailyChartInstance = new Chart(ctxDaily, {
        type: 'bar',
        data: {
            labels: weekLabels,
            datasets: [
                {
                    label: myLabel,
                    data: finalYou,
                    backgroundColor: '#3b82f6',
                    barPercentage: 1.0,
                    categoryPercentage: 0.65,
                    borderRadius: 6
                },
                {
                    label: `Topper`,
                    data: finalTop,
                    backgroundColor: '#fbbf24',
                    barPercentage: 1.0,
                    categoryPercentage: 0.65,
                    borderRadius: 6
                },
                {
                    label: `Class Avg`,
                    data: finalAvg,
                    backgroundColor: '#10b981',
                    barPercentage: 1.0,
                    categoryPercentage: 0.65,
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true, position: 'top', align: 'start',
                    labels: { usePointStyle: true, boxWidth: 8, font: { family: 'Segoe UI', weight: '600', size: 11 }, color: '#64748b' }
                }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f1f5f9' }, border: {display: false} },
                x: { grid: { display: false }, border: {display: false} }
            }
        }
    });

    let c = targetUser.history.correct;
    let w = targetUser.history.wrong;
    let pieData = [c, w];
    let pieColors = ['#10b981', '#ef4444'];
    if (c === 0 && w === 0) { pieData = [1]; pieColors = ['#e2e8f0']; }

    pieChartInstance = new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: ['Correct', 'Wrong'],
            datasets: [{
                data: pieData,
                backgroundColor: pieColors,
                borderWidth: 0,
                borderRadius: 8,
                spacing: 5
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '80%',
            plugins: { legend: { display: false }, tooltip: { enabled: false } }
        }
        // 🟢 FIX: Removed the conflicting 'textCenter' plugin so the HTML overlay works perfectly
    });
}
