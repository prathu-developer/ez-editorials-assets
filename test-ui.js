// test-ui.js - Presentation & DOM Controller for Active Test & Solutions
// Connects QuizEngine and PlatformBridge cleanly to the DOM interface.

(function (window) {
    'use strict';

    const engine = new window.QuizEngine();
    window.activeQuizEngine = engine;

    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('quiz_id');
    const attemptIdParam = urlParams.get('attempt_id');
    const isPractice = urlParams.get('practice') === 'true';
    const isReviewMode = urlParams.get('mode') === 'review';

    let isPassageExpanded = false;
    let isSubmitting = false;

    // ==========================================
    // 1. ANTI-CHEAT LISTENERS
    // ==========================================
    function setupAntiCheat() {
        window.addEventListener('keydown', function (e) {
            // Un-trap Escape key: dismiss active modal overlays cleanly across all test and review states
            if (e.key === 'Escape') {
                const openModals = ['palette-modal', 'settings-modal', 'submit-modal', 'review-palette-modal', 'submit-failure-modal'];
                let closedAny = false;
                for (const mId of openModals) {
                    const mEl = document.getElementById(mId);
                    if (mEl && (mEl.style.display === 'flex' || window.getComputedStyle(mEl).display === 'flex')) {
                        closeModal(mId);
                        closedAny = true;
                    }
                }
                if (closedAny) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
                // If no modal was open, safely no-op without anti-cheat penalty
                return;
            }

            const isLive = document.getElementById('live-test-container')?.style.display !== 'none';
            if (!isLive || isReviewMode) return;

            // Suppress F5, Ctrl+R
            if (e.key === 'F5' || (e.ctrlKey && (e.key === 'r' || e.key === 'R'))) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        }, { capture: true, passive: false });

        window.addEventListener('beforeunload', function (e) {
            const isLive = document.getElementById('live-test-container')?.style.display !== 'none';
            if (isLive && !isReviewMode && !isSubmitting) {
                e.preventDefault();
                e.returnValue = 'You have an active examination session in progress. Leaving will forfeit your time and unsaved answers.';
                return e.returnValue;
            }
        });

        window.addEventListener('contextmenu', function (e) {
            if (document.getElementById('live-test-container')?.style.display !== 'none' && !isReviewMode) {
                e.preventDefault();
            }
        });
    }

    // ==========================================
    // 1B. CBT DESKTOP KEYBOARD SHORTCUTS
    // ==========================================
    function setupKeyboardShortcuts() {
        window.addEventListener('keydown', function (e) {
            const isLive = document.getElementById('live-test-container')?.style.display !== 'none';
            if (!isLive || isReviewMode) return;

            // Ignore when focused inside form inputs or editable elements
            const targetTag = e.target?.tagName?.toLowerCase();
            if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select' || e.target?.isContentEditable) {
                return;
            }

            // Disallow if modifier keys are held
            if (e.ctrlKey || e.altKey || e.metaKey) return;

            // Strictly guard: only fire when no modal overlay is visible
            const modalIds = ['palette-modal', 'settings-modal', 'submit-modal', 'review-palette-modal', 'submit-failure-modal'];
            const hasOpenModal = modalIds.some(id => {
                const el = document.getElementById(id);
                return el && (el.style.display === 'flex' || window.getComputedStyle(el).display === 'flex');
            });
            if (hasOpenModal) return;

            const currentQ = engine.questions[engine.currentIndex];
            const numOptions = currentQ?.options?.length || 0;

            // 1-5 Number Keys & A-E Letter Keys: Select Option (C selects Option C)
            const optMap = {
                '1': 0, 'A': 0,
                '2': 1, 'B': 1,
                '3': 2, 'C': 2,
                '4': 3, 'D': 3,
                '5': 4, 'E': 4
            };
            const keyUpper = e.key.toUpperCase();
            if (Object.prototype.hasOwnProperty.call(optMap, keyUpper)) {
                const optIdx = optMap[keyUpper];
                if (optIdx < numOptions) {
                    e.preventDefault();
                    window.PlatformBridge?.haptic('selection');
                    engine.selectOption(optIdx);
                    loadQuestion(engine.currentIndex);
                    return;
                }
            }

            // Clear Response: Backspace, Delete
            if (e.key === 'Backspace' || e.key === 'Delete') {
                e.preventDefault();
                clearResponse();
                return;
            }

            // Save & Next: Enter
            if (e.key === 'Enter') {
                e.preventDefault();
                saveAndNext();
                return;
            }

            // Mark for Review & Next: M, m
            if (e.key === 'm' || e.key === 'M') {
                e.preventDefault();
                markAndNext();
                return;
            }

            // Navigation: Left Arrow -> Prev Question
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prevQuestion();
                return;
            }

            // Navigation: Right Arrow -> Save & Next
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                saveAndNext();
                return;
            }
        });
    }

    // ==========================================
    // 2. EXAM CONTENT FORMATTERS & RC HIGHLIGHTS
    // ==========================================
    function formatExamContent(text) {
        if (!text) return "";
        let escaped = String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        escaped = escaped.replace(/&lt;(\/?(?:strong|em|b|i|u|mark|span|code)(?:\s+[^&>]*)?)&gt;/gi, '<$1>');
        escaped = escaped.replace(/\*\*\*([^*]+?)\*\*\*/g, '<strong><em>$1</em></strong>');
        escaped = escaped.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
        // Prevent multi-underscore blanks (e.g. `(1) ______`) from being matched as markdown bold
        escaped = escaped.replace(/(?<![_\w])__([a-zA-Z0-9][^_]*?[a-zA-Z0-9])__(?![_\w])/g, '<strong>$1</strong>');
        escaped = escaped.replace(/`([^`]+?)`/g, '<code style="background:rgba(0,0,0,0.06);padding:2px 5px;border-radius:4px;font-family:monospace;font-size:0.9em;">$1</code>');
        return escaped;
    }

    function extractRcTargetJs(qText, expl, passageText) {
        if (!qText && !expl) return null;
        qText = String(qText || '');
        expl = String(expl || '');
        passageText = String(passageText || '');

        function cleanToken(s) {
            return s.replace(/^['"`’“\s,.;:!?()[\]{}]+|['"`’”?\s,.;:!?()[\]{}]+$/g, '');
        }

        // 1. Check if question tests a BLANK
        let mBlank = qText.match(/\bblank\s*(?:['"`’“]?\(([A-Za-z0-9]{1,3})\)['"`’”?]?|['"`’“]?\[([A-Za-z0-9]{1,3})\]['"`’”?]?|['"`’`]([A-Za-z0-9]{1,3})['"`’”?]|(?:\b([A-Z]|[1-9][0-9]?)\b))/);
        let bId = null;
        if (mBlank) {
            bId = (mBlank[1] || mBlank[2] || mBlank[3] || mBlank[4]).toUpperCase();
        } else if (/\b(?:fill\s+(?:in\s+)?(?:the\s+)?blank|blank\s+in\s+the\s+passage)\b/i.test(qText)) {
            let mPasB = passageText.match(/(?:\(([A-Za-z0-9])\)|\[([A-Za-z0-9])\])(?:\s*\[?_{2,}\]?)?/);
            bId = mPasB ? (mPasB[1] || mPasB[2]).toUpperCase() : 'A';
        }
        if (bId) return { type: 'blank', id: bId, label: '(' + bId + ')' };

        // 2. Direct quoted word in question
        let mQ = qText.match(/(?:highlighted|specified|underlined)?\s*(?:word|phrase|expression|pronoun|term|sentence)?\s*['"`’“](\s*[^'"`’”?\n]{1,60}\s*)['"`’”?]/i);
        if (mQ) {
            let cand = cleanToken(mQ[1]);
            if (cand) {
                let esc = cand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                if (new RegExp('\\b' + esc + '\\b', 'i').test(passageText)) {
                    return { type: 'word', text: cand };
                }
            }
        }

        // 3. Explanation: quote before refers to / means / implies
        let expMatches = expl.matchAll(/['"`’“]([^'"`’”?\n]{1,60})['"`’”?]\s+(?:refers(?:\s+\w+)?\s+to|means|implies|signifies|is used to|can be replaced)/gi);
        for (let m of expMatches) {
            let cand = cleanToken(m[1]);
            if (cand) {
                let esc = cand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                if (new RegExp('\\b' + esc + '\\b', 'i').test(passageText)) return { type: 'word', text: cand };
            }
        }

        // 4. Explanation contextual quotes
        let ctxMatches = expl.matchAll(/(?:in the passage|in context|in the context of|the phrase|the expression|the word)[\s:]*['"`’“]([^'"`’”?\n]{1,60})['"`’”?]/gi);
        for (let m of ctxMatches) {
            let cand = cleanToken(m[1]);
            if (cand) {
                let esc = cand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                if (new RegExp('\\b' + esc + '\\b', 'i').test(passageText)) return { type: 'word', text: cand };
            }
        }

        return null;
    }

    function formatSolutionText(text) {
        if (!text) return "No detailed explanation available.";

        let escaped = String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // 1. Headers: ### Header, ## Header
        escaped = escaped.replace(/^### (.*$)/gim, '<h4 style="margin: 10px 0 4px 0; font-size: 13.5px; font-weight: 700; color: var(--text-dark, #111827); font-family: inherit;">$1</h4>');
        escaped = escaped.replace(/^## (.*$)/gim, '<h3 style="margin: 12px 0 6px 0; font-size: 14.5px; font-weight: 800; color: var(--text-dark, #111827); font-family: inherit;">$1</h3>');

        // 2. Bold: **text** or __text__
        escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--text-dark, #111827); font-weight: 700;">$1</strong>');
        escaped = escaped.replace(/__(.*?)__/g, '<strong style="color: var(--text-dark, #111827); font-weight: 700;">$1</strong>');

        // 3. Italic: *text* or _text_
        escaped = escaped.replace(/(^|[^\*])\*([^\*\n]+)\*([^\*]|$)/g, '$1<em>$2</em>$3');

        // 4. Inline code: `term`
        escaped = escaped.replace(/`([^`\n]+)`/g, '<code style="background: rgba(90, 50, 250, 0.08); padding: 1.5px 5px; border-radius: 4px; font-family: monospace; font-size: 0.9em; color: #5a32fa;">$1</code>');

        // 5. Bullet lines: •, -, or *
        escaped = escaped.replace(/^[•\-\*]\s+(.*)$/gim, '<div style="display: flex; align-items: baseline; gap: 8px; margin: 4px 0; line-height: 1.55;"><span style="color: #5a32fa; font-weight: bold; font-size: 14px; flex-shrink: 0; line-height: 1;">•</span><span>$1</span></div>');

        // 6. Multiple newlines -> spacing div, single newline -> <br/>
        escaped = escaped.replace(/\n\n+/g, '<div style="height: 10px;"></div>');
        escaped = escaped.replace(/<\/div><br\/>/g, '</div>');
        escaped = escaped.replace(/\n/g, '<br/>');

        return escaped;
    }

    // ==========================================
    // 3. UI RENDERING ENGINE
    // ==========================================
    function loadQuestion(index) {
        const q = engine.questions[index];
        if (!q) return;

        engine.currentIndex = index;
        const qId = q.question_id || q.id;
        document.getElementById('q-num').innerText = index + 1;

        const secTitleEl = document.getElementById('review-section-title');
        if (secTitleEl) {
            secTitleEl.innerText = q.section || q.topic || 'English';
        }

        // 1. Review Mode Headers & Stats
        if (isReviewMode) {
            let savedTimes = {};
            try {
                const cacheKey = 'quiz_times_' + (attemptIdParam || quizId || 'temp');
                savedTimes = JSON.parse(localStorage.getItem(cacheKey)) || {};
            } catch (e) {}

            const userSec = q.user_time_spent || savedTimes[qId] || engine.questionTimeSpent[qId] || 0;
            const avgSec = q.global_avg_time || 15;

            const formatTimeDigits = (sec) => {
                const m = Math.floor(sec / 60).toString().padStart(2, '0');
                const s = (sec % 60).toString().padStart(2, '0');
                return `${m}:${s}`;
            };

            const timePill = document.getElementById('review-time-pill');
            if (timePill) {
                if (userSec > 0) {
                    const isTimeTrap = (userSec >= avgSec * 1.5 && userSec >= 18) || (userSec >= 35 && !q.is_correct);
                    const isFast = userSec <= avgSec * 0.75;
                    if (isTimeTrap) {
                        timePill.className = 'stat-pill red-tint';
                        timePill.innerHTML = `⏱️ Time Trap: ${formatTimeDigits(userSec)} <span style="opacity:0.75; font-size:10.5px;">(Avg: ${formatTimeDigits(avgSec)})</span>`;
                    } else if (isFast) {
                        timePill.className = 'stat-pill green-tint';
                        timePill.innerHTML = `⚡ ${formatTimeDigits(userSec)} <span style="opacity:0.75; font-size:10.5px;">(Avg: ${formatTimeDigits(avgSec)})</span>`;
                    } else {
                        timePill.className = 'stat-pill';
                        timePill.innerHTML = `⏱️ ${formatTimeDigits(userSec)} <span style="opacity:0.75; font-size:10.5px;">(Avg: ${formatTimeDigits(avgSec)})</span>`;
                    }
                } else {
                    timePill.className = 'stat-pill';
                    timePill.innerHTML = `⏱️ Skipped <span style="opacity:0.75; font-size:10.5px;">(Avg: ${formatTimeDigits(avgSec)})</span>`;
                }
            }

            const accPill = document.getElementById('review-acc-pill');
            if (accPill) {
                if (isPractice) {
                    accPill.innerText = `🎯 Practice Mode`;
                    accPill.className = 'stat-pill green-tint';
                } else {
                    const currentAcc = q.global_accuracy || 0;
                    accPill.innerText = `👥 ${currentAcc}% Answered correctly`;
                    accPill.className = currentAcc < 50 ? 'stat-pill red-tint' : 'stat-pill green-tint';
                }
            }

            updateReviewNavButtons();
        }

        // 2. Parse Options, Passage, and Instruction
        let opts = q.options;
        let passage = "";
        let instruction = "";

        if (typeof opts === 'string') {
            try { opts = JSON.parse(opts); } catch (e) {}
        }
        if (opts && typeof opts === 'object' && !Array.isArray(opts)) {
            passage = opts.passage || "";
            instruction = opts.instruction || "";
            opts = opts.options || [];
        }
        if (!Array.isArray(opts)) opts = [];

        // 3. Highlight Passage Targets
        const passageBlock = document.getElementById('passage-block');
        const instText = document.getElementById('inst-text');
        const passageText = document.getElementById('passage-text');
        const viewMoreBtn = document.getElementById('view-more-btn');

        let rawQText = q.text || q.question_text || '';
        let currentPassage = passage;

        if (passage && passage.trim() !== "") {
            const target = extractRcTargetJs(rawQText, q.explanation, currentPassage);
            if (target) {
                if (target.type === 'blank') {
                    const bId = target.id;
                    const bLabel = target.label;
                    if (!rawQText.includes(bLabel) && !rawQText.includes(`blank ${bId}`)) {
                        rawQText = rawQText.replace(/\bblank\b/i, `blank <strong class="rc-active-target rc-blank">${bLabel}</strong>`);
                    }
                    const escId = bId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const blankRegex = new RegExp(`(?:\\*\\*)?(?:\\(${escId}\\)|\\[${escId}\\])(?:\\s*\\[?_{2,}\\]?)?(?:\\*\\*)?`, 'i');
                    if (blankRegex.test(currentPassage)) {
                        currentPassage = currentPassage.replace(blankRegex, `<strong class="rc-active-target rc-blank">${bLabel} [______]</strong>`);
                    }
                } else if (target.type === 'word') {
                    const escTarget = target.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const boldRegex = new RegExp(`\\*\\*\\s*(${escTarget})\\s*\\*\\*`, 'i');
                    if (boldRegex.test(currentPassage)) {
                        currentPassage = currentPassage.replace(boldRegex, '<strong class="rc-active-target">$1</strong>');
                    } else {
                        const wordRegex = new RegExp(`\\b(${escTarget})\\b`, 'i');
                        if (wordRegex.test(currentPassage)) {
                            currentPassage = currentPassage.replace(wordRegex, '<strong class="rc-active-target">$1</strong>');
                        }
                    }
                }
            }
            currentPassage = currentPassage.replace(/(?<!class="[^"]*)(\([A-Za-z0-9]{1,3}\))\s*(?:\[_{2,}\]|_{2,})/g, '<strong class="rc-blank">$1 [______]</strong>');
        }

        // Desktop 50/50 Split-Pane Class Toggle
        const workspace = document.getElementById('cbt-question-workspace');
        const scrollArea = document.querySelector('.cbt-left-pane .scroll-area');
        const hasPassage = Boolean(currentPassage && currentPassage.trim() !== "");
        if (workspace) {
            if (hasPassage) {
                workspace.classList.add('has-passage');
                if (scrollArea) scrollArea.classList.add('has-passage-active');
            } else {
                workspace.classList.remove('has-passage');
                if (scrollArea) scrollArea.classList.remove('has-passage-active');
            }
        }

        if (instruction || currentPassage) {
            if (passageBlock) passageBlock.style.display = 'block';
            if (instText) {
                instText.style.display = instruction ? 'block' : 'none';
                instText.innerHTML = formatExamContent(instruction);
            }
            if (passageText) {
                passageText.style.display = currentPassage ? 'block' : 'none';
                passageText.innerHTML = formatExamContent(currentPassage);
                if (isPassageExpanded) {
                    passageText.classList.remove('collapsed');
                    if (viewMoreBtn) viewMoreBtn.innerText = "View less";
                } else {
                    passageText.classList.add('collapsed');
                    if (viewMoreBtn) viewMoreBtn.innerText = "...View more";
                }
            }
            if (viewMoreBtn) viewMoreBtn.style.display = currentPassage ? 'inline-block' : 'none';
        } else if (passageBlock) {
            passageBlock.style.display = 'none';
        }

        // 4. Question Text
        const qTextEl = document.getElementById('q-text');
        if (qTextEl) qTextEl.innerHTML = formatExamContent(rawQText);

        // 5. Options Rendering
        const optsContainer = document.getElementById('options-container');
        if (optsContainer) {
            optsContainer.innerHTML = '';
            const letters = ['A', 'B', 'C', 'D', 'E'];
            const isReviewState = isReviewMode && !engine.reattemptModeActive;
            const reattemptAnswer = engine.reattemptResponses[qId];

            opts.forEach((optText, i) => {
                const optDiv = document.createElement('div');
                optDiv.className = 'option';
                const formattedOpt = formatExamContent(optText);

                if (isReviewState) {
                    let badge = '';
                    const isUserChoice = (i === q.user_selected_index);
                    if (i === q.correct_index) {
                        optDiv.classList.add('correct-reveal');
                        badge = `<div class="opt-badge badge-correct">${isUserChoice ? '✓ Your Choice' : '✓ Correct'}</div>`;
                    } else if (isUserChoice) {
                        optDiv.classList.add('wrong-reveal');
                        badge = '<div class="opt-badge badge-wrong">✗ Your Choice</div>';
                    }
                    optDiv.innerHTML = `<div class="opt-letter">${letters[i]}</div><div class="opt-text">${formattedOpt}</div>${badge}`;
                    optDiv.style.cursor = 'default';
                } else if (isReviewMode && engine.reattemptModeActive) {
                    let badge = '';
                    if (reattemptAnswer !== undefined) {
                        if (i === q.correct_index) {
                            optDiv.classList.add('correct-reveal');
                            badge = `<div class="opt-badge badge-correct">${reattemptAnswer === i ? '✓ Correct!' : '✓ Correct'}</div>`;
                        } else if (i === reattemptAnswer) {
                            optDiv.classList.add('wrong-reveal');
                            badge = '<div class="opt-badge badge-wrong">✗ Incorrect</div>';
                        }
                    } else if (engine.responses[qId] === i) {
                        optDiv.classList.add('selected');
                    }
                    optDiv.innerHTML = `<div class="opt-letter">${letters[i]}</div><div class="opt-text">${formattedOpt}</div><kbd class="kbd-hint opt-kbd-hint">${i + 1}</kbd>${badge}`;
                    optDiv.onclick = () => {
                        window.PlatformBridge?.haptic('selection');
                        engine.selectOption(i);
                        loadQuestion(index);
                    };
                } else {
                    if (engine.responses[qId] === i) optDiv.classList.add('selected');
                    optDiv.innerHTML = `<div class="opt-letter">${letters[i]}</div><div class="opt-text">${formattedOpt}</div><kbd class="kbd-hint opt-kbd-hint">${i + 1}</kbd>`;
                    optDiv.onclick = () => {
                        window.PlatformBridge?.haptic('selection');
                        engine.selectOption(i);
                        loadQuestion(index);
                    };
                }
                optsContainer.appendChild(optDiv);
            });
        }

        // 6. Review Mode Solutions Display
        const solBox = document.getElementById('solution-box');
        const accBody = document.getElementById('acc-body');
        const unattemptedWarn = document.getElementById('unattempted-warning');

        if (isReviewMode) {
            if (solBox) solBox.style.display = 'block';
            if (accBody) {
                accBody.innerHTML = formatSolutionText(q.explanation);
                accBody.classList.remove('show');
            }
            if (unattemptedWarn) {
                unattemptedWarn.style.display = (q.user_selected_index === null && engine.reattemptResponses[qId] === undefined) ? 'block' : 'none';
            }
        } else {
            if (solBox) solBox.style.display = 'none';
            if (unattemptedWarn) unattemptedWarn.style.display = 'none';

            // Next / Submit Button States
            const nextBtn = document.getElementById('btn-next');
            if (nextBtn) {
                if (index === engine.questions.length - 1) {
                    nextBtn.innerText = "Submit Test";
                    nextBtn.onclick = openSubmitModal;
                } else {
                    nextBtn.innerText = "Save & Next";
                    nextBtn.onclick = saveAndNext;
                }
            }
            const prevBtn = document.getElementById('btn-prev');
            if (prevBtn) prevBtn.disabled = (index === 0);

            updatePaletteColors();
        }
    }

    // ==========================================
    // 4. PALETTE BUILDERS & MODALS
    // ==========================================
    function buildPalette() {
        const grids = [
            { el: document.getElementById('palette-grid'), prefix: 'pal-' },
            { el: document.getElementById('cbt-palette-grid'), prefix: 'cbt-pal-' }
        ];

        const palTotal = document.getElementById('pal-total');
        const cbtTotal = document.getElementById('cbt-q-total');
        if (palTotal) palTotal.innerText = engine.questions.length;
        if (cbtTotal) cbtTotal.innerText = engine.questions.length;

        grids.forEach(({ el, prefix }) => {
            if (!el) return;
            el.innerHTML = '';
            engine.questions.forEach((q, idx) => {
                const btn = document.createElement('div');
                btn.className = 'pal-btn not-visited';
                btn.id = `${prefix}${idx}`;
                btn.innerText = idx + 1;
                btn.onclick = () => {
                    window.PlatformBridge?.haptic('selection');
                    engine.navigate(idx);
                    loadQuestion(idx);
                    closeModal('palette-modal');
                };
                el.appendChild(btn);
            });
        });
        updatePaletteColors();
    }

    function updatePaletteColors() {
        const counts = engine.getSummaryCounts();

        engine.questions.forEach((q, idx) => {
            const btns = [
                document.getElementById(`pal-${idx}`),
                document.getElementById(`cbt-pal-${idx}`)
            ].filter(Boolean);

            const state = engine.getQuestionState(idx);
            btns.forEach(btn => {
                btn.className = 'pal-btn ' + state;
                if (idx === engine.currentIndex) btn.classList.add('current');
            });
        });

        // Desktop Sidebar Count Elements
        const elAns = document.getElementById('cbt-cnt-answered');
        const elNotAns = document.getElementById('cbt-cnt-not-answered');
        const elRev = document.getElementById('cbt-cnt-review');
        const elRevAns = document.getElementById('cbt-cnt-review-answered');
        const elNotVis = document.getElementById('cbt-cnt-not-visited');
        if (elAns) elAns.innerText = counts.answered;
        if (elNotAns) elNotAns.innerText = counts.notAnswered;
        if (elRev) elRev.innerText = counts.review;
        if (elRevAns) elRevAns.innerText = counts.reviewAndAnswered;
        if (elNotVis) elNotVis.innerText = counts.notVisited;
    }

    function buildReviewPalette() {
        const grids = [
            { el: document.getElementById('review-palette-grid'), prefix: 'rev-pal-' },
            { el: document.getElementById('cbt-review-palette-grid'), prefix: 'cbt-rev-pal-' }
        ];

        const filteredIndices = getFilteredQuestionIndices();
        const palTotal = document.getElementById('pal-total-rev');
        const palAtt = document.getElementById('pal-att-rev');
        const cbtTotal = document.getElementById('cbt-q-total');
        if (palTotal) palTotal.innerText = filteredIndices.length;
        if (cbtTotal) cbtTotal.innerText = filteredIndices.length;

        const revTabName = document.getElementById('review-tab-name');
        if (revTabName && engine.questions && engine.questions[engine.currentIndex]) {
            const currQ = engine.questions[engine.currentIndex];
            revTabName.innerText = currQ.section || currQ.topic || 'English';
        }

        let attemptedInFilter = 0;

        grids.forEach(({ el, prefix }) => {
            if (!el) return;
            el.innerHTML = '';
            if (filteredIndices.length === 0) {
                el.innerHTML = `<div style="grid-column: span 5; text-align: center; color: var(--text-muted); padding: 24px 0; font-size: 13px; font-weight: 500;">No questions match this filter.</div>`;
                return;
            }

            filteredIndices.forEach((idx) => {
                const q = engine.questions[idx];
                const isUnattempted = (q.user_selected_index === null || q.user_selected_index === undefined);
                const isCorrect = q.is_correct === true;
                if (!isUnattempted && prefix === 'rev-pal-') attemptedInFilter++;

                const btn = document.createElement('div');
                btn.className = 'rev-pal-item';
                btn.id = `${prefix}${idx}`;
                btn.innerText = idx + 1;

                if (isUnattempted) btn.classList.add('rev-unattempted');
                else if (isCorrect) btn.classList.add('rev-correct');
                else btn.classList.add('rev-incorrect');

                if (idx === engine.currentIndex) btn.classList.add('current');

                btn.onclick = () => {
                    window.PlatformBridge?.haptic('selection');
                    engine.navigate(idx);
                    loadQuestion(idx);
                    closeModal('review-palette-modal');
                };
                el.appendChild(btn);
            });
        });

        if (palAtt) palAtt.innerText = attemptedInFilter;
    }

    function getFilteredQuestionIndices() {
        const indices = [];
        engine.questions.forEach((q, idx) => {
            const isUnattempted = (q.user_selected_index === null || q.user_selected_index === undefined);
            const isCorrect = q.is_correct === true;
            const isIncorrect = (!isUnattempted && !isCorrect);

            if (engine.reviewFilters.all) indices.push(idx);
            else if (isCorrect && engine.reviewFilters.correct) indices.push(idx);
            else if (isIncorrect && engine.reviewFilters.incorrect) indices.push(idx);
            else if (isUnattempted && engine.reviewFilters.unattempted) indices.push(idx);
        });
        return indices;
    }

    function updateReviewNavButtons() {
        const filtered = getFilteredQuestionIndices();
        const currentPos = filtered.indexOf(engine.currentIndex);
        const prevBtn = document.getElementById('btn-review-prev');
        const nextBtn = document.getElementById('btn-review-next');

        if (prevBtn) {
            const canPrev = currentPos > 0;
            prevBtn.disabled = !canPrev;
            prevBtn.style.opacity = canPrev ? '1' : '0.4';
            prevBtn.style.pointerEvents = canPrev ? 'auto' : 'none';
        }

        if (nextBtn) {
            const canNext = currentPos !== -1 && currentPos < filtered.length - 1;
            nextBtn.disabled = !canNext;
            nextBtn.style.opacity = canNext ? '1' : '0.4';
            nextBtn.style.pointerEvents = canNext ? 'auto' : 'none';
        }

        // Highlight active question in review palettes
        document.querySelectorAll('.rev-pal-item').forEach(el => el.classList.remove('current'));
        const revPalActive = document.getElementById(`rev-pal-${engine.currentIndex}`);
        if (revPalActive) revPalActive.classList.add('current');
        const cbtRevPalActive = document.getElementById(`cbt-rev-pal-${engine.currentIndex}`);
        if (cbtRevPalActive) cbtRevPalActive.classList.add('current');
    }

    // ==========================================
    // 5. USER ACTIONS & MODAL CONTROLLERS
    // ==========================================
    function togglePassage() {
        window.PlatformBridge?.haptic('light');
        isPassageExpanded = !isPassageExpanded;
        const pText = document.getElementById('passage-text');
        const vBtn = document.getElementById('view-more-btn');
        if (pText && vBtn) {
            if (isPassageExpanded) {
                pText.classList.remove('collapsed');
                vBtn.innerText = "View less";
            } else {
                pText.classList.add('collapsed');
                vBtn.innerText = "...View more";
            }
        }
    }

    function markAndNext() {
        window.PlatformBridge?.haptic('light');
        engine.markAndNext();
        loadQuestion(engine.currentIndex);
    }

    function saveAndNext() {
        window.PlatformBridge?.haptic('light');
        if (engine.currentIndex < engine.questions.length - 1) {
            engine.saveAndNext();
            loadQuestion(engine.currentIndex);
        } else {
            openSubmitModal();
        }
    }

    function prevQuestion() {
        if (engine.currentIndex > 0) {
            window.PlatformBridge?.haptic('light');
            engine.prev();
            loadQuestion(engine.currentIndex);
        }
    }

    function clearResponse() {
        window.PlatformBridge?.haptic('light');
        engine.clearResponse();
        document.querySelectorAll('.option').forEach(el => el.classList.remove('selected'));
        updatePaletteColors();
    }

    function openPalette() {
        window.PlatformBridge?.haptic('medium');
        if (isReviewMode) {
            openReviewPalette();
        } else {
            updatePaletteColors();
            const m = document.getElementById('palette-modal');
            if (m) m.style.display = 'flex';
        }
    }

    function openReviewPalette() {
        window.PlatformBridge?.haptic('medium');
        const menu = document.getElementById('filter-popover');
        if (menu) menu.style.display = 'none';
        buildReviewPalette();
        const m = document.getElementById('review-palette-modal');
        if (m) m.style.display = 'flex';
    }

    function openSubmitModal() {
        window.PlatformBridge?.haptic('warning');
        const counts = engine.getSummaryCounts();
        const total = engine.questions.length;

        const dispTitle = document.getElementById('display-title');
        const examTitleEl = document.getElementById('summary-exam-title');
        if (dispTitle && examTitleEl && dispTitle.innerText) {
            examTitleEl.innerText = dispTitle.innerText;
        }

        const elAns = document.getElementById('sum-cnt-answered');
        const elNotAns = document.getElementById('sum-cnt-not-answered');
        const elRev = document.getElementById('sum-cnt-review');
        const elRevAns = document.getElementById('sum-cnt-review-answered');
        const elNotVis = document.getElementById('sum-cnt-not-visited');
        const elTotal = document.getElementById('sum-cnt-total');

        if (elAns) elAns.innerText = counts.answered;
        if (elNotAns) elNotAns.innerText = counts.notAnswered;
        if (elRev) elRev.innerText = counts.review;
        if (elRevAns) elRevAns.innerText = counts.reviewAndAnswered;
        if (elNotVis) elNotVis.innerText = counts.notVisited;
        if (elTotal) elTotal.innerText = total;

        // Unattempted Question Alert
        const unattempted = counts.notAnswered + counts.notVisited;
        const warnBox = document.getElementById('submit-unattempted-warning');
        const warnText = document.getElementById('submit-unattempted-text');
        if (warnBox && unattempted > 0) {
            warnBox.style.display = 'flex';
            if (warnText) warnText.innerText = `You have ${unattempted} unattempted question${unattempted > 1 ? 's' : ''}. Are you sure you want to end the test?`;
        } else if (warnBox) {
            warnBox.style.display = 'none';
        }

        const m = document.getElementById('submit-modal');
        if (m) m.style.display = 'flex';
    }

    function closeModal(id) {
        window.PlatformBridge?.haptic('soft');
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    }

    function openSettingsModal() {
        window.PlatformBridge?.haptic('medium');
        const m = document.getElementById('settings-modal');
        if (m) m.style.display = 'flex';
    }

    function applyFontSize(size) {
        window.PlatformBridge?.haptic('light');
        document.body.classList.remove('font-small', 'font-large', 'font-xlarge');
        if (size !== 'normal') document.body.classList.add(`font-${size}`);
    }

    function toggleReattemptMode() {
        const toggle = document.getElementById('reattempt-toggle');
        engine.reattemptModeActive = Boolean(toggle?.checked);
        window.PlatformBridge?.haptic(engine.reattemptModeActive ? 'success' : 'light');
        loadQuestion(engine.currentIndex);
    }

    function toggleReviewFilterMenu(e) {
        if (e) e.stopPropagation();
        window.PlatformBridge?.haptic('light');
        const menu = document.getElementById('filter-popover');
        if (menu) menu.style.display = menu.style.display === 'none' ? 'flex' : 'none';
    }

    function handleFilterCheckboxChange(type) {
        window.PlatformBridge?.haptic('light');
        const allCb = document.getElementById('flt-all');
        const corCb = document.getElementById('flt-correct');
        const incCb = document.getElementById('flt-incorrect');
        const unaCb = document.getElementById('flt-unattempted');

        if (type === 'all') {
            const checked = allCb.checked;
            corCb.checked = checked;
            incCb.checked = checked;
            unaCb.checked = checked;
        } else {
            allCb.checked = (corCb.checked && incCb.checked && unaCb.checked);
        }
    }

    function applyReviewFilters(e) {
        if (e) e.stopPropagation();
        window.PlatformBridge?.haptic('medium');
        const allCb = document.getElementById('flt-all');
        const corCb = document.getElementById('flt-correct');
        const incCb = document.getElementById('flt-incorrect');
        const unaCb = document.getElementById('flt-unattempted');

        if (!allCb.checked && !corCb.checked && !incCb.checked && !unaCb.checked) {
            allCb.checked = true;
            corCb.checked = true;
            incCb.checked = true;
            unaCb.checked = true;
        }

        engine.reviewFilters.all = allCb.checked;
        engine.reviewFilters.correct = corCb.checked;
        engine.reviewFilters.incorrect = incCb.checked;
        engine.reviewFilters.unattempted = unaCb.checked;

        const popover = document.getElementById('filter-popover');
        if (popover) popover.style.display = 'none';

        buildReviewPalette();
        const filtered = getFilteredQuestionIndices();
        if (filtered.length > 0) {
            if (!filtered.includes(engine.currentIndex)) {
                engine.navigate(filtered[0]);
                loadQuestion(filtered[0]);
            } else {
                updateReviewNavButtons();
            }
        } else {
            alert("No questions match selected filter.");
        }
    }

    function reviewNavigate(direction) {
        window.PlatformBridge?.haptic('light');
        const filtered = getFilteredQuestionIndices();
        if (filtered.length === 0) return;
        const currentPos = filtered.indexOf(engine.currentIndex);
        let targetPos = -1;
        if (currentPos !== -1) {
            targetPos = currentPos + direction;
        } else {
            targetPos = direction > 0 
                ? filtered.findIndex(idx => idx > engine.currentIndex)
                : filtered.slice().reverse().findIndex(idx => idx < engine.currentIndex);
        }
        if (targetPos >= 0 && targetPos < filtered.length) {
            const nextIdx = filtered[targetPos];
            engine.navigate(nextIdx);
            loadQuestion(nextIdx);
        }
    }

    function exitTestEarly() {
        isSubmitting = true;
        window.PlatformBridge?.haptic('medium');
        const returnUrl = urlParams.get('return_url');
        if (returnUrl) {
            window.location.href = returnUrl;
            return;
        }
        const dayParam = urlParams.get('day');
        window.PlatformBridge?.exitToHome(dayParam);
    }

    function goBackFromResult() {
        window.PlatformBridge?.haptic('light');
        const returnUrl = urlParams.get('return_url');
        const dayParam = urlParams.get('day');
        const dayQuery = dayParam !== null ? `&day=${dayParam}` : '';
        const retQuery = returnUrl ? `&return_url=${encodeURIComponent(returnUrl)}` : '';
        if (isPractice) window.location.href = `result.html?practice=true${dayQuery}${retQuery}`;
        else window.location.href = `result.html?attempt_id=${attemptIdParam}${dayQuery}${retQuery}`;
    }

    // ==========================================
    // 6. SUBMISSION HANDLER
    // ==========================================
    async function submitQuiz() {
        window.PlatformBridge?.haptic('heavy');
        closeModal('submit-modal');

        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.innerText = 'Submitting Test...';
            loadingScreen.style.display = 'flex';
        }

        try {
            const res = await engine.submit();
            isSubmitting = true;
            try {
                localStorage.removeItem('ez_cbt_submission_backup');
            } catch (e) {}

            const returnUrl = urlParams.get('return_url');
            const dayParam = urlParams.get('day');
            const dayQuery = dayParam !== null ? `&day=${dayParam}` : '';
            const retQuery = returnUrl ? `&return_url=${encodeURIComponent(returnUrl)}` : '';

            if (res.practice) {
                window.location.href = `result.html?practice=true${dayQuery}${retQuery}`;
            } else {
                window.location.href = `result.html?attempt_id=${res.attempt_id}${dayQuery}${retQuery}`;
            }
        } catch (err) {
            console.error('[CBT Submission Failure]', err);
            if (loadingScreen) loadingScreen.style.display = 'none';

            // Preserve full test state in localStorage
            const backupPayload = {
                quizId: engine.quizId || 'daily_cbt',
                responses: engine.responses,
                questionStates: engine.questionStates,
                timeRemaining: engine.timeRemaining,
                totalTimeSpent: engine.totalTimeSpent || 0,
                savedAt: new Date().toISOString(),
                errorMessage: err ? (err.message || String(err)) : 'Network timeout / Server disruption'
            };
            try {
                localStorage.setItem('ez_cbt_submission_backup', JSON.stringify(backupPayload));
            } catch (storageErr) {
                console.warn('[CBT Resilience] Failed to save submission backup to localStorage', storageErr);
            }

            // Display in-app inline retry modal instead of generic alert()
            const errEl = document.getElementById('failure-error-message');
            if (errEl) {
                errEl.innerText = err?.message || 'Server timeout or connection dropped. Answers safely cached.';
            }
            const failModal = document.getElementById('submit-failure-modal');
            if (failModal) {
                failModal.style.display = 'flex';
            }
        }
    }

    function retryQuizSubmission() {
        closeModal('submit-failure-modal');
        submitQuiz();
    }

    function copySubmissionBackup() {
        try {
            const backup = localStorage.getItem('ez_cbt_submission_backup');
            if (backup && navigator.clipboard) {
                navigator.clipboard.writeText(backup).then(() => {
                    const btn = document.getElementById('btn-copy-backup');
                    if (btn) {
                        const originalText = btn.innerText;
                        btn.innerText = '✓ Copied!';
                        setTimeout(() => { btn.innerText = originalText; }, 2000);
                    }
                });
            }
        } catch (e) {
            console.warn('[CBT Resilience] Clipboard copy failed', e);
        }
    }

    // ==========================================
    // 7. INITIALIZATION FLOW
    // ==========================================
    async function init() {
        setupAntiCheat();
        setupKeyboardShortcuts();

        // Bind Timer Tick Event
        engine.on('timerTick', (remaining, formatted, isWarning, isCritical) => {
            const timerDisplay = document.getElementById('timer-display');
            if (timerDisplay) {
                timerDisplay.innerText = formatted;
                if (isCritical) {
                    timerDisplay.classList.add('timer-critical', 'timer-warning');
                } else if (isWarning) {
                    timerDisplay.classList.remove('timer-critical');
                    timerDisplay.classList.add('timer-warning');
                } else {
                    timerDisplay.classList.remove('timer-warning', 'timer-critical');
                }
            }

            const cbtClock = document.getElementById('cbt-timer-clock');
            if (cbtClock) {
                cbtClock.innerText = formatted;
                if (isCritical) {
                    cbtClock.classList.add('timer-critical', 'timer-warning');
                } else if (isWarning) {
                    cbtClock.classList.remove('timer-critical');
                    cbtClock.classList.add('timer-warning');
                } else {
                    cbtClock.classList.remove('timer-warning', 'timer-critical');
                }
            }
        });

        engine.on('timeExpired', () => {
            submitQuiz();
        });

        // Setup Candidate Profile in Desktop Sidebar
        try {
            const user = window.PlatformBridge ? window.PlatformBridge.getUserProfile() : null;
            const nameEl = document.getElementById('cbt-user-name');
            const subEl = document.getElementById('cbt-user-sub');
            const targetExam = localStorage.getItem('ez_target_exam') || 'SSC CGL / Banking';
            if (nameEl) {
                if (user && (user.first_name || user.username)) {
                    nameEl.innerText = user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.username;
                } else {
                    nameEl.innerText = `Student #${window.PlatformBridge?.getUserId() || 101}`;
                }
                if (subEl) subEl.innerText = `🎯 Target: ${targetExam}`;
            }
        } catch (e) {}

        // Review Mode Initialization
        if (isReviewMode) {
            const ls = document.getElementById('loading-screen');
            if (ls) ls.innerText = "Loading Analytics...";
            const liveCont = document.getElementById('live-test-container');
            if (liveCont) liveCont.style.display = 'flex';
            const liveNav = document.getElementById('live-nav');
            if (liveNav) liveNav.style.display = 'none';
            const revNav = document.getElementById('review-nav');
            if (revNav) revNav.style.display = 'flex';
            const liveBottomBar = document.getElementById('live-bottom-bar');
            if (liveBottomBar) liveBottomBar.style.display = 'none';
            const revBottomBar = document.getElementById('review-bottom-bar');
            if (revBottomBar) revBottomBar.style.display = 'block';
            const revStatsBar = document.getElementById('review-stats-bar');
            if (revStatsBar) revStatsBar.style.display = 'flex';
            const revSecStrip = document.getElementById('review-section-strip');
            if (revSecStrip) revSecStrip.style.display = 'flex';

            // Desktop Sidebar for Review
            const cbtPal = document.getElementById('cbt-palette-grid');
            const cbtRevPal = document.getElementById('cbt-review-palette-grid');
            const cbtTimer = document.getElementById('cbt-timer-box');
            const cbtLegend = document.getElementById('cbt-legend-box');
            const cbtActions = document.getElementById('cbt-sidebar-actions');
            const cbtRevActions = document.getElementById('cbt-review-sidebar-actions');
            if (cbtPal) cbtPal.style.display = 'none';
            if (cbtRevPal) cbtRevPal.style.display = 'grid';
            if (cbtTimer) cbtTimer.style.display = 'none';
            if (cbtLegend) cbtLegend.style.display = 'none';
            if (cbtActions) cbtActions.style.display = 'none';
            if (cbtRevActions) cbtRevActions.style.display = 'block';

            try {
                await engine.initReviewMode(attemptIdParam, isPractice);
                buildReviewPalette();
                loadQuestion(0);
                if (ls) ls.style.display = 'none';
            } catch (err) {
                console.error('[QuizReview] Failed to load review:', err);
                alert("Failed to load review: " + (err.message || 'Unknown error'));
                exitTestEarly();
            }
            return;
        }

        // Live Test Mode Initialization
        try {
            const onColdStartStatus = (status) => {
                const ls = document.getElementById('loading-screen');
                if (ls) {
                    ls.innerHTML = `
                        <div style="text-align:center; padding: 24px;">
                            <div style="font-size:32px; margin-bottom:8px;">⚡</div>
                            <div style="font-size:16px; font-weight:700;">Waking Up Server...</div>
                            <div style="font-size:13px; color:var(--text-muted); margin-top:6px;">${status.message}</div>
                        </div>
                    `;
                }
            };
            const meta = await engine.initLiveQuiz(quizId, null, isPractice, onColdStartStatus);
            if (meta) {
                const setSafeText = (id, val) => {
                    const el = document.getElementById(id);
                    if (el) el.innerText = val;
                };
                setSafeText('display-title', meta.topic);
                setSafeText('summary-topic', meta.topic);
                setSafeText('inst-topic', meta.topic);
                setSafeText('pal-total', meta.question_count);
                setSafeText('inst-qcount', meta.question_count);
                setSafeText('inst-qcount-text', meta.question_count);
                setSafeText('inst-marks', meta.question_count);
            }
            const ls = document.getElementById('loading-screen');
            if (ls) ls.style.display = 'none';
            // Bypass casual quiz test-mode popup directly to Instructions screen
            const is = document.getElementById('instructions-screen');
            if (is) is.style.display = 'flex';
        } catch (err) {
            console.error('[QuizInit] Failed to initialize quiz:', err);
            alert("Failed to initialize quiz: " + (err.message || 'Please retry.'));
            exitTestEarly();
        }
    }

    async function beginTest() {
        window.PlatformBridge?.haptic('medium');
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.innerText = "Starting Timer...";
            loadingScreen.style.display = 'flex';
        }

        const onColdStartStatus = (status) => {
            if (loadingScreen) {
                loadingScreen.innerHTML = `
                    <div style="text-align:center; padding: 24px;">
                        <div style="font-size:32px; margin-bottom:8px;">⚡</div>
                        <div style="font-size:16px; font-weight:700;">Connecting...</div>
                        <div style="font-size:13px; color:var(--text-muted); margin-top:6px;">${status.message}</div>
                    </div>
                `;
            }
        };

        try {
            const startRes = await engine.startLiveAttempt(onColdStartStatus);
            if (startRes && startRes.completed) {
                const returnUrl = urlParams.get('return_url');
                const dayParam = urlParams.get('day');
                const dayQuery = dayParam !== null ? `&day=${dayParam}` : '';
                const retQuery = returnUrl ? `&return_url=${encodeURIComponent(returnUrl)}` : '';
                window.location.href = `result.html?attempt_id=${startRes.attempt_id}${dayQuery}${retQuery}`;
                return;
            }

            const instScreen = document.getElementById('instructions-screen');
            if (instScreen) instScreen.style.display = 'none';

            const liveContainer = document.getElementById('live-test-container');
            if (liveContainer) liveContainer.style.display = 'flex';

            const topBarControls = document.getElementById('top-bar-controls');
            if (topBarControls) topBarControls.style.display = 'flex';

            const liveBottomBar = document.getElementById('live-bottom-bar');
            if (liveBottomBar) liveBottomBar.style.display = 'block';

            buildPalette();
            loadQuestion(0);
            if (loadingScreen) loadingScreen.style.display = 'none';
        } catch (err) {
            console.error('[QuizBegin] Error starting attempt:', err);
            alert("Error: " + (err.message || 'Unable to start test. Please retry.'));
            exitTestEarly();
        }
    }

    function proceedToInstructions() {
        window.PlatformBridge?.haptic('light');
        const tmm = document.getElementById('test-mode-modal');
        if (tmm) tmm.style.display = 'none';
        const is = document.getElementById('instructions-screen');
        if (is) is.style.display = 'flex';
    }

    function closeTestModeModal(e, force = false) {
        if (force || e?.target?.id === 'test-mode-modal') {
            window.PlatformBridge?.haptic('soft');
            const tmm = document.getElementById('test-mode-modal');
            if (tmm) tmm.style.display = 'none';
            exitTestEarly();
        }
    }

    // Attach to global window object
    window.init = init;
    window.beginTest = beginTest;
    window.proceedToInstructions = proceedToInstructions;
    window.closeTestModeModal = closeTestModeModal;
    window.loadQuestion = loadQuestion;
    window.selectOption = (optIndex, el) => {
        window.PlatformBridge?.haptic('selection');
        engine.selectOption(optIndex);
        loadQuestion(engine.currentIndex);
    };
    window.markAndNext = markAndNext;
    window.saveAndNext = saveAndNext;
    window.prevQuestion = prevQuestion;
    window.clearResponse = clearResponse;
    window.openPalette = openPalette;
    window.openReviewPalette = openReviewPalette;
    window.closeModal = closeModal;
    window.openSettingsModal = openSettingsModal;
    window.applyFontSize = applyFontSize;
    window.openSubmitModal = openSubmitModal;
    window.submitQuiz = submitQuiz;
    window.togglePassage = togglePassage;
    window.toggleReattemptMode = toggleReattemptMode;
    window.toggleReviewFilterMenu = toggleReviewFilterMenu;
    window.handleFilterCheckboxChange = handleFilterCheckboxChange;
    window.applyReviewFilters = applyReviewFilters;
    window.reviewNavigate = reviewNavigate;
    window.retryQuizSubmission = retryQuizSubmission;
    window.copySubmissionBackup = copySubmissionBackup;
    window.exitTestEarly = exitTestEarly;
    window.goBackFromResult = goBackFromResult;

    document.addEventListener('DOMContentLoaded', init);

})(window);
