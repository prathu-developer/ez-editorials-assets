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
        { name: 'Gen I', class: 'bg-genesis', icon: '✨' }, 
        { name: 'Gen II', class: 'bg-genesis', icon: '✨' }, 
        { name: 'Gen III', class: 'bg-genesis', icon: '✨' }, 
        { name: 'Gen IV', class: 'bg-genesis', icon: '✨' }, 
        { name: 'Gen V', class: 'bg-genesis', icon: '✨' },  
        { name: 'Gen VI', class: 'bg-genesis', icon: '✨' }, 
        { name: 'Gen VII', class: 'bg-genesis', icon: '✨' },
        { name: 'Gen VIII', class: 'bg-genesis', icon: '✨' },
        { name: 'Gen IX', class: 'bg-genesis', icon: '✨' }, 
        { name: 'Gen X', class: 'bg-genesis', icon: '👑' }   
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

    // --- SAFETY NET: PREVENT UNDEFINED ID CRASH ---
    window.currentUserData = data.current_user || {
        id: null,
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

    const listDiv = document.getElementById('list');
    listDiv.innerHTML = '';
    globalData = data.leaderboard;

    let targetAverage = data.target_average || 0;
    let insertedPromoDivider = false;
    let insertedDemoDivider = false;
    
    let htmlBuffer = "";
    let demotionRenderCount = 0;

    data.leaderboard.forEach((user, index) => {
        let isDemotion = user.score < targetAverage;
        if (isDemotion) {
            demotionRenderCount++;
        }

        if (isDemotion && demotionRenderCount > 10 && user.id !== window.currentUserData.id) {
            return; 
        }

        // --- MASTER SPEC: CHECK IF THIS ROW BELONGS TO THE VIEWER ---
        let isMe = (user.id === window.currentUserData.id);

        let cascadeDelay = index * 0.04;

        let rankDisplay = `#${user.rank}`;
        if (user.rank === 1) rankDisplay = '🥇';
        else if (user.rank === 2) rankDisplay = '🥈';
        else if (user.rank === 3) rankDisplay = '🥉';

        let userLeagueBadge = getLeagueBadgeHTML(user.league);

        let trendIcon = user.score >= targetAverage
            ? `<span style="color: #10b981; font-size: 0.8em; margin-left: 6px;" title="Promotion Zone">▲</span>`
            : `<span style="color: #ef4444; font-size: 0.8em; margin-left: 6px;" title="Demotion Zone">▼</span>`;

        if (!insertedPromoDivider && user.score >= targetAverage) {
            htmlBuffer += `
                <div style="display: flex; align-items: center; margin: 0 0 15px 0; opacity: 0.95;">
                    <div style="flex: 1; height: 1px; background: linear-gradient(90deg, transparent, #10b981);"></div>
                    <div style="padding: 5px 14px; font-size: 0.7em; font-weight: 800; color: #10b981; background: #d1fae5; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 5px; box-shadow: 0 2px 5px rgba(16, 185, 129, 0.15);">
                        <span>▲</span> PROMOTION ZONE <span>▲</span>
                    </div>
                    <div style="flex: 1; height: 1px; background: linear-gradient(270deg, transparent, #10b981);"></div>
                </div>
            `;
            insertedPromoDivider = true;
        }

        if (!insertedDemoDivider && user.score < targetAverage) {
            htmlBuffer += `
                <div id="demotionZoneLine" style="display: flex; align-items: center; margin: 20px 0 15px 0; opacity: 0.95;">
                    <div style="flex: 1; height: 1px; background: linear-gradient(90deg, transparent, #ef4444);"></div>
                    <div style="padding: 5px 14px; font-size: 0.7em; font-weight: 800; color: #ef4444; background: #fee2e2; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 5px; box-shadow: 0 2px 5px rgba(239, 68, 68, 0.15);">
                        <span>▼</span> DEMOTION ZONE <span>▼</span>
                    </div>
                    <div style="flex: 1; height: 1px; background: linear-gradient(270deg, transparent, #ef4444);"></div>
                </div>
            `;
            insertedDemoDivider = true;
        }

        let clickAction = `onclick="openProfile(${user.id})"`;
        let cursorStyle = `cursor: pointer;`;
        let rowBgClass = getLeagueBgClass(user.league, 'row');
        
        // --- MASTER SPEC: VISUALLY HIGHLIGHT "YOU" IN THE MAIN LIST ---
        let displayName = isMe ? `<span style="font-weight: 900; color: #3b82f6;">You</span>` : user.name;
        let meHighlightStyle = isMe ? `border: 1px solid #bfdbfe; box-shadow: 0 0 10px rgba(59, 130, 246, 0.15);` : ``;

        htmlBuffer += `
            <div class="rank-row ${rowBgClass}" ${clickAction} style="${cursorStyle} ${meHighlightStyle} animation-delay: ${cascadeDelay}s;">
                <div class="rank-left">
                    <div class="rank-number">${rankDisplay}</div>
                    <div class="user-details">
                        <div class="user-name">${displayName}</div>
                        <div class="user-sub-details">
                            ${userLeagueBadge}
                        </div>
                    </div>
                </div>
                <div class="user-score">${user.score % 1 !== 0 ? user.score.toFixed(2) : user.score} pts ${trendIcon}</div>
            </div>
        `;
    });

    listDiv.innerHTML = htmlBuffer;

    const footerDiv = document.getElementById('footer');
    const me = window.currentUserData;

    let myLeagueBadge = getLeagueBadgeHTML(me.league);
    
    let myTrendIcon = me.score >= targetAverage
        ? `<span style="color: #10b981; font-size: 0.8em; margin-left: 6px;" title="Promotion Zone">▲</span>`
        : `<span style="color: #ff6b6b; font-size: 0.8em; margin-left: 6px;" title="Demotion Zone">▼</span>`;

    footerDiv.onclick = () => openProfile(me.id);
    footerDiv.style.background = getLeagueFooterColor(me.league);

    footerDiv.style.display = 'flex'; // Unhide the footer in the SPA!

    footerDiv.innerHTML = `
        <div style="display:flex; flex-direction:column; width:100%;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div class="rank-left">
                    <div class="rank-number" style="color: #2a5298;">#${me.rank}</div>
                    <div class="user-details">
                        <div class="user-name">You</div>
                        <div class="user-sub-details">
                            ${myLeagueBadge}
                        </div>
                    </div>
                </div>
                <div class="user-score" style="background: linear-gradient(135deg, #1e3c72, #2a5298); color: white; display: flex; align-items: center;">${me.score % 1 !== 0 ? me.score.toFixed(2) : me.score} pts ${myTrendIcon}</div>
            </div>
            <div style="text-align:center; font-size:0.75em; color:#64748b; margin-top:8px; font-weight: 600;">Tap here to view your dashboard 📊</div>
        </div>
    `;
}

const cacheKey = 'quizCupData_' + userId;
const cachedString = localStorage.getItem(cacheKey);
if (cachedString) {
    try {
        renderLeaderboardData(JSON.parse(cachedString));
    } catch (e) { console.error("Cache read error", e); }
}

fetch(`https://ez-editorials-bot.onrender.com/api/leaderboard?user_id=${userId}`)
    .then(response => response.json())
    .then(data => {
        if (data.locked || data.error) {
            console.log("Server is syncing. Using cached data.");
            return;
        }

        const tgUserId = Number(tg.initDataUnsafe?.user?.id) || 0;
        const ADMIN_IDS = [716496729, 5103843488, 6251430317];
        const isAdmin = ADMIN_IDS.includes(tgUserId);

        let myPersonalData = {
            "rank": "N/A", "score": 0, "house": "🏳️ Unsorted", "name": "You", "is_captain": 0, "league": 0, 
            "is_admin": isAdmin, 
            "rank_history": [], "history": {"labels": [], "scores": [], "accuracy": 0, "correct": 0, "wrong": 0}
        };

        if (tgUserId) {
            let matchedUser = data.leaderboard.find(student => Number(student.id) === tgUserId);
            if (matchedUser) {
                myPersonalData = {
                    ...matchedUser,
                    "is_admin": isAdmin 
                };
            }
        }
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

        let score = entry.score || 0;
        let att = entry.attempts || 0;
        let cor = entry.correct || 0;

        let clickAction = `onclick="openHistoryDetail(${entry.week}, ${entry.rank}, ${entry.total}, ${score}, ${att}, ${cor})"`;

        container.innerHTML += `
            <div class="activity-row" ${clickAction} style="align-items: center; cursor: pointer; padding: 12px 10px; border-radius: 8px; margin-bottom: 5px; background: white; border: 1px solid #f1f5f9; box-shadow: 0 1px 2px rgba(0,0,0,0.02); transition: transform 0.1s;">
                <div class="act-day" style="width: auto; font-weight: 600; color: #0f172a;">Week ${entry.week} ${statusBadge}</div>
                <div style="display:flex; align-items:center; gap: 12px;">
                    <div class="text-blue" style="font-weight: 700; font-size: 1.05em;">
                        #${entry.rank} <span style="font-size: 0.75em; color: #64748b; font-weight: normal;">/ ${entry.total}</span>
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

function openProfile(targetId) {
    let isOwnProfile = (targetId === window.currentUserData.id);

    if (!isOwnProfile && !window.currentUserData.is_admin) {
        if (window.Telegram?.WebApp?.showAlert) {
            window.Telegram.WebApp.showAlert("🔒 Only Admins can view other students' detailed analysis.");
        } else {
            alert("🔒 Only Admins can view other students' detailed analysis.");
        }
        return; 
    }

    let targetUser = isOwnProfile ? window.currentUserData : globalData.find(u => u.id === targetId);
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
    
    let topper = globalData.length > 0 ? globalData[0] : targetUser;

    let topCor = topper.history.correct;
    let topWro = topper.history.wrong;
    let topStat = {
        correct: topCor,
        wrong: topWro,
        attempts: topper.attempts,
        accuracy: topper.attempts > 0 ? Math.round((topCor / topper.attempts) * 100) : 0,
        score: topper.score
    };

    let totalClassCorrect = 0;
    let totalClassWrong = 0;
    let totalClassAttempts = 0;
    let totalClassScore = 0;

    globalData.forEach(u => {
        totalClassCorrect += u.history.correct;
        totalClassWrong += u.history.wrong;
        totalClassAttempts += u.attempts;
        totalClassScore += u.score;
    });

    let participants = globalData.length > 0 ? globalData.length : 1;

    let avgStat = {
        correct: Math.round(totalClassCorrect / participants),
        wrong: Math.round(totalClassWrong / participants),
        attempts: Math.round(totalClassAttempts / participants),
        score: Math.round(totalClassScore / participants),
        accuracy: totalClassAttempts > 0 ? Math.round((totalClassCorrect / totalClassAttempts) * 100) : 0
    };

    document.getElementById('tblStudentHeader').innerText = isOwnProfile ? 'You' : targetUser.name.split(' ')[0];

    document.getElementById('tblYouCor').innerHTML = `${targetUser.history.correct} <span style="font-size:0.8em; color:#64748b;">(${targetUser.history.accuracy}%)</span>`;
    document.getElementById('tblYouWro').innerHTML = `${targetUser.history.wrong} <span style="font-size:0.8em; color:#64748b;">(${totalAttempts > 0 ? 100 - targetUser.history.accuracy : 0}%)</span>`;
    document.getElementById('tblYouAtt').innerText = totalAttempts;
    document.getElementById('tblYouAcc').innerText = targetUser.history.accuracy + '%';

    document.getElementById('tblTopCor').innerHTML = `${topStat.correct} <span style="font-size:0.8em; color:#64748b;">(${topStat.accuracy}%)</span>`;
    document.getElementById('tblTopWro').innerHTML = `${topStat.wrong} <span style="font-size:0.8em; color:#64748b;">(${topStat.attempts > 0 ? 100 - topStat.accuracy : 0}%)</span>`;
    document.getElementById('tblTopAtt').innerText = topStat.attempts;
    document.getElementById('tblTopAcc').innerText = topStat.accuracy + '%';

    document.getElementById('tblAvgCor').innerHTML = `${avgStat.correct} <span style="font-size:0.8em; color:#64748b;">(${avgStat.accuracy}%)</span>`;
    document.getElementById('tblAvgWro').innerHTML = `${avgStat.wrong} <span style="font-size:0.8em; color:#64748b;">(${avgStat.attempts > 0 ? 100 - avgStat.accuracy : 0}%)</span>`;
    document.getElementById('tblAvgAtt').innerText = avgStat.attempts;
    document.getElementById('tblAvgAcc').innerText = avgStat.accuracy + '%';

    document.getElementById('bannerTopperName').innerHTML = topper.name;
    document.getElementById('bannerTopperInfo').innerText = `${topper.score % 1 !== 0 ? topper.score.toFixed(2) : topper.score} pts • ${topStat.accuracy}% Accuracy`;

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
    let acc = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;

    document.getElementById('histWeek').innerText = week;
    document.getElementById('histRank').innerText = `#${rank}`;
    document.getElementById('histScore').innerText = (score % 1 !== 0 ? score.toFixed(2) : score);
    document.getElementById('histAcc').innerText = acc + '%';
    document.getElementById('histCorrect').innerText = correct;

    document.getElementById('historyModalOverlay').classList.add('active');
}

function closeHistoryModal(event, force=false) {
    if (force || event.target.id === 'historyModalOverlay') {
        document.getElementById('historyModalOverlay').classList.remove('active');
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
        },
        plugins: [{
            id: 'textCenter',
            beforeDraw: function(chart) {
                var width = chart.width, height = chart.height, ctx = chart.ctx;
                ctx.restore();
                var fontSize = (height / 80).toFixed(2);
                ctx.font = "bold " + fontSize + "em sans-serif";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "#0f172a";
                var text = targetUser.history.accuracy + "%",
                    textX = Math.round((width - ctx.measureText(text).width) / 2),
                    textY = height / 2;
                if(c>0 || w>0) ctx.fillText(text, textX, textY);

                ctx.font = "500 " + (fontSize * 0.4) + "em sans-serif";
                ctx.fillStyle = "#64748b";
                var subText = "Accuracy",
                    subX = Math.round((width - ctx.measureText(subText).width) / 2),
                    subY = height / 2 + 15;
                if(c>0 || w>0) ctx.fillText(subText, subX, subY);
                ctx.save();
            }
        }]
    });
}

let globalEloData = [];
let eloAutoOpened = false; 

const oldRender = renderLeaderboardData;
renderLeaderboardData = function(data) {
    oldRender(data); 

    globalData.forEach(u => {
        let matched = data.leaderboard.find(x => x.id === u.id);
        if (matched) u.elo = matched.elo;
    });
    window.currentUserData.elo = data.current_user.elo || 1000;
    globalEloData = data.elo_ranking || [];
    
    if (tg.initDataUnsafe?.start_param === 'elo' && !eloAutoOpened) {
        openEloLeaderboard();
        eloAutoOpened = true; 
    }
};

function openEloLeaderboard() {
    const container = document.getElementById('eloListContainer');
    container.innerHTML = '';

    let top50Active = globalEloData.filter(eu => eu.is_active).slice(0, 50);

    top50Active.forEach(eu => {
        let isMe = eu.id === window.currentUserData.id;
        let bg = isMe ? "background: #eff6ff; border: 1px solid #bfdbfe;" : "background: white; border: 1px solid #edf1f5;";

        container.innerHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; margin-bottom: 8px; border-radius: 12px; ${bg} box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-weight: 900; color: #94a3b8; width: 25px;">#${eu.rank}</div>
                    <div style="font-weight: bold; color: #1e293b;">${eu.name}</div>
                </div>
                <div style="font-weight: 800; color: #2563eb;">🧠 ${Math.round(eu.elo)}</div>
            </div>
        `;
    });

    const footer = document.getElementById('eloFooter');
    let myEloEntry = globalEloData.find(eu => eu.id === window.currentUserData.id);
    let myTitle = getAcademicTitle(window.currentUserData.elo);

    let myRankDisplay = myEloEntry ? `#${myEloEntry.rank}` : 'N/A';
    let myEloDisplay = myEloEntry ? Math.round(myEloEntry.elo) : Math.round(window.currentUserData.elo);

    let inactivityWarning = myEloEntry && !myEloEntry.is_active
        ? `<div style="font-size: 0.7em; color: #ef4444; margin-top: 2px;">Hidden from public board (Inactive)</div>`
        : ``;

    footer.innerHTML = `
        <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="font-weight: 900; color: #cbd5e1;">${myRankDisplay}</div>
                <div>
                    <div style="font-weight: bold;">You</div>
                    <div style="font-size: 0.75em; color: #94a3b8;">${myTitle}</div>
                    ${inactivityWarning}
                </div>
            </div>
            <div style="font-weight: 800; color: #60a5fa;">🧠 ${myEloDisplay}</div>
        </div>
    `;

    document.getElementById('eloModalOverlay').classList.add('active');
}

function closeEloModal(event, force=false) {
    if (force || event.target.id === 'eloModalOverlay') {
        document.getElementById('eloModalOverlay').classList.remove('active');
    }
}
