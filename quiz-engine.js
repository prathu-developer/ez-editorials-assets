// quiz-engine.js - Headless Quiz Core & State Engine
// Manages question state, timers, candidate responses, and API synchronization with zero DOM dependencies.

(function (window) {
    'use strict';

    const API_BASE = 'https://ez-editorials-bot.onrender.com';

    class QuizEngine {
        constructor() {
            this.reset();
            this.callbacks = {};
        }

        reset() {
            this.quizId = null;
            this.attemptId = null;
            this.userId = null;
            this.isPractice = false;
            this.isReviewMode = false;
            this.topicName = 'Quiz';
            this.initialDuration = 0;
            this.timeRemaining = 0;
            this.endTime = 0;
            this.timerInterval = null;

            this.questions = [];
            this.currentIndex = 0;
            this.responses = {};             // { [questionId]: selectedIndex }
            this.reattemptResponses = {};    // For review mode reattempts
            this.reviewStatus = {};          // { [questionId]: boolean }
            this.visitedQuestions = {};      // { [index]: boolean }
            this.questionTimeSpent = {};     // { [questionId]: seconds }
            this.currentQuestionStartTime = Date.now();

            this.reviewFilters = {
                all: true,
                correct: true,
                incorrect: true,
                unattempted: true
            };
            this.reattemptModeActive = false;
            this.isSubmitting = false;
        }

        on(event, handler) {
            if (!this.callbacks[event]) this.callbacks[event] = [];
            this.callbacks[event].push(handler);
        }

        emit(event, ...args) {
            const handlers = this.callbacks[event] || [];
            handlers.forEach(fn => {
                try { fn(...args); } catch (e) { console.error(`[QuizEngine Error in ${event}]`, e); }
            });
        }

        // ==========================================
        // 1. INITIALIZATION & DATA FETCHING
        // ==========================================

        /**
         * Initializes a live quiz session metadata
         */
        async initLiveQuiz(quizId, userId, isPractice = false) {
            this.reset();
            this.quizId = quizId;
            this.userId = userId || (window.PlatformBridge ? window.PlatformBridge.getUserId() : 0);
            this.isPractice = Boolean(isPractice);

            const headers = window.PlatformBridge ? window.PlatformBridge.getAuthHeaders() : { 'Content-Type': 'application/json' };
            const uidParam = this.userId ? `?user_id=${this.userId}` : '';
            
            const res = await fetch(`${API_BASE}/api/quiz/today${uidParam}`, { headers });
            if (!res.ok) throw new Error(`Failed to load quiz metadata (HTTP ${res.status})`);
            
            const data = await res.json();
            const allQuizzes = [...(data.quizzes?.Today || []), ...(data.quizzes?.Pending || [])];
            const meta = allQuizzes.find(q => String(q.id) === String(quizId));

            if (meta) {
                this.topicName = meta.topic || 'Quiz';
                this.initialDuration = Number(meta.duration_seconds || 300);
            }
            return meta;
        }

        /**
         * Starts the quiz attempt timer and retrieves questions from backend
         */
        async startLiveAttempt() {
            const headers = window.PlatformBridge 
                ? window.PlatformBridge.getAuthHeaders({ 'Content-Type': 'application/json' }) 
                : { 'Content-Type': 'application/json' };

            const res = await fetch(`${API_BASE}/api/quiz/start`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    user_id: this.userId,
                    quiz_set_id: this.quizId,
                    is_practice: this.isPractice
                })
            });

            if (!res.ok) throw new Error(`Could not start quiz (HTTP ${res.status})`);
            const data = await res.json();

            // Already completed check
            if (data.completed) {
                return { completed: true, attempt_id: data.attempt_id, message: data.message };
            }

            if (data.error) throw new Error(data.error);

            this.attemptId = data.attempt_id;
            this.questions = data.questions || [];
            this.initialDuration = Number(data.duration_seconds || this.initialDuration || 300);
            this.timeRemaining = Number(data.remaining_seconds || this.initialDuration);

            // Mark question 0 as visited
            this.currentIndex = 0;
            this.visitedQuestions[0] = true;
            this.currentQuestionStartTime = Date.now();

            this._startTimer();
            this.emit('stateUpdated', this.getSummaryCounts());
            this.emit('questionChanged', this.currentIndex, this.getCurrentQuestion());

            return {
                completed: false,
                attemptId: this.attemptId,
                questionsCount: this.questions.length,
                durationSeconds: this.initialDuration,
                remainingSeconds: this.timeRemaining
            };
        }

        /**
         * Initializes review mode from an attempt or practice session
         */
        async initReviewMode(attemptIdParam, isPractice = false, userId = null) {
            this.reset();
            this.isReviewMode = true;
            this.isPractice = Boolean(isPractice);
            this.attemptId = attemptIdParam;
            this.userId = userId || (window.PlatformBridge ? window.PlatformBridge.getUserId() : 0);

            let data;
            if (this.isPractice) {
                const stored = sessionStorage.getItem('practiceResult');
                if (!stored) throw new Error('No practice results found in current session');
                data = JSON.parse(stored);
            } else {
                const headers = window.PlatformBridge ? window.PlatformBridge.getAuthHeaders() : {};
                const uidParam = this.userId ? `?user_id=${this.userId}` : '';
                const res = await fetch(`${API_BASE}/api/quiz/result/${attemptIdParam}${uidParam}`, { headers });
                if (!res.ok) throw new Error(`Failed to load review (HTTP ${res.status})`);
                data = await res.json();
            }

            if (!data || data.error) throw new Error(data?.error || 'Review data not found');

            this.questions = data.solutions || [];
            this.currentIndex = 0;
            this.visitedQuestions[0] = true;

            this.emit('questionChanged', this.currentIndex, this.getCurrentQuestion());
            return data;
        }

        // ==========================================
        // 2. TIMER MANAGEMENT
        // ==========================================

        _startTimer() {
            if (this.timerInterval) clearInterval(this.timerInterval);

            this.endTime = Date.now() + (this.timeRemaining * 1000);

            this.timerInterval = setInterval(() => {
                const now = Date.now();
                this.timeRemaining = Math.max(0, Math.floor((this.endTime - now) / 1000));

                const minutes = Math.floor(this.timeRemaining / 60);
                const seconds = this.timeRemaining % 60;
                const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

                this.emit('timerTick', this.timeRemaining, formatted, this.timeRemaining <= 60);

                if (this.timeRemaining <= 0) {
                    clearInterval(this.timerInterval);
                    this.timerInterval = null;
                    this.emit('timeExpired');
                }
            }, 1000);
        }

        stopTimer() {
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
            }
        }

        // ==========================================
        // 3. CANDIDATE RESPONSES & NAVIGATION
        // ==========================================

        getCurrentQuestion() {
            return this.questions[this.currentIndex] || null;
        }

        getCurrentQuestionId() {
            const q = this.getCurrentQuestion();
            return q ? (q.question_id || q.id) : null;
        }

        recordCurrentQuestionTime() {
            const qId = this.getCurrentQuestionId();
            if (!qId) return;
            const elapsed = Math.max(1, Math.round((Date.now() - this.currentQuestionStartTime) / 1000));
            this.questionTimeSpent[qId] = (this.questionTimeSpent[qId] || 0) + elapsed;
            this.currentQuestionStartTime = Date.now();
        }

        selectOption(optIndex) {
            const qId = this.getCurrentQuestionId();
            if (!qId) return;

            if (this.isReviewMode && this.reattemptModeActive) {
                this.reattemptResponses[qId] = optIndex;
            } else if (!this.isReviewMode) {
                this.responses[qId] = optIndex;
            }

            this.emit('stateUpdated', this.getSummaryCounts());
        }

        clearResponse() {
            const qId = this.getCurrentQuestionId();
            if (!qId) return;

            if (this.isReviewMode && this.reattemptModeActive) {
                delete this.reattemptResponses[qId];
            } else if (!this.isReviewMode) {
                delete this.responses[qId];
            }

            this.emit('stateUpdated', this.getSummaryCounts());
        }

        markAndNext() {
            const qId = this.getCurrentQuestionId();
            if (qId) {
                this.reviewStatus[qId] = true;
            }
            this.recordCurrentQuestionTime();

            if (this.currentIndex < this.questions.length - 1) {
                this.navigate(this.currentIndex + 1);
            } else {
                this.emit('stateUpdated', this.getSummaryCounts());
            }
        }

        saveAndNext() {
            const qId = this.getCurrentQuestionId();
            if (qId) {
                this.reviewStatus[qId] = false;
            }
            this.recordCurrentQuestionTime();

            if (this.currentIndex < this.questions.length - 1) {
                this.navigate(this.currentIndex + 1);
            } else {
                this.emit('stateUpdated', this.getSummaryCounts());
            }
        }

        navigate(targetIndex) {
            if (targetIndex < 0 || targetIndex >= this.questions.length) return;
            this.recordCurrentQuestionTime();
            this.currentIndex = targetIndex;
            this.visitedQuestions[targetIndex] = true;
            this.currentQuestionStartTime = Date.now();

            this.emit('questionChanged', this.currentIndex, this.getCurrentQuestion());
            this.emit('stateUpdated', this.getSummaryCounts());
        }

        next() {
            if (this.currentIndex < this.questions.length - 1) {
                this.navigate(this.currentIndex + 1);
            }
        }

        prev() {
            if (this.currentIndex > 0) {
                this.navigate(this.currentIndex - 1);
            }
        }

        // ==========================================
        // 4. PALETTE & STATUS COUNTS
        // ==========================================

        getQuestionState(index) {
            const q = this.questions[index];
            if (!q) return 'not-visited';
            const qId = q.question_id || q.id;

            const isAnswered = this.responses[qId] !== undefined && this.responses[qId] !== null;
            const isMarked = Boolean(this.reviewStatus[qId]);
            const isVisited = Boolean(this.visitedQuestions[index]);

            if (isMarked && isAnswered) return 'review-answered';
            if (isMarked) return 'review';
            if (isAnswered) return 'answered';
            if (isVisited) return 'not-answered';
            return 'not-visited';
        }

        getSummaryCounts() {
            let answered = 0;
            let notAnswered = 0;
            let review = 0;
            let reviewAndAnswered = 0;
            let notVisited = 0;

            this.questions.forEach((q, idx) => {
                const state = this.getQuestionState(idx);
                if (state === 'answered') answered++;
                else if (state === 'not-answered') notAnswered++;
                else if (state === 'review') review++;
                else if (state === 'review-answered') reviewAndAnswered++;
                else notVisited++;
            });

            return {
                total: this.questions.length,
                answered,
                notAnswered,
                review,
                reviewAndAnswered,
                notVisited
            };
        }

        // ==========================================
        // 5. QUIZ SUBMISSION
        // ==========================================

        async submit() {
            if (this.isSubmitting) return;
            this.isSubmitting = true;
            this.stopTimer();

            // Record duration on final question
            this.recordCurrentQuestionTime();

            const timeSpent = this.initialDuration - Math.max(0, Math.floor((this.endTime - Date.now()) / 1000));

            try {
                if (this.attemptId) localStorage.setItem(`attempt_duration_${this.attemptId}`, timeSpent);
                if (this.quizId) localStorage.setItem(`quiz_duration_${this.quizId}`, timeSpent);
            } catch (e) {}

            // Practice Mode Submission Handling
            if (this.attemptId === 'practice_mode' || this.isPractice) {
                let correctCount = 0;
                let wrongCount = 0;
                let unattemptedCount = 0;
                let score = 0;

                const localSolutions = this.questions.map(q => {
                    const qId = q.question_id || q.id;
                    const uIdx = this.responses[qId] !== undefined ? this.responses[qId] : null;
                    let isCorr = false;

                    if (uIdx === null) {
                        unattemptedCount++;
                    } else if (uIdx === q.correct_index) {
                        isCorr = true;
                        correctCount++;
                        score += 1.0;
                    } else {
                        wrongCount++;
                        score -= 0.25;
                    }

                    return {
                        question_id: qId,
                        text: q.text || q.question_text,
                        options: q.options,
                        correct_index: q.correct_index,
                        explanation: q.explanation,
                        user_selected_index: uIdx,
                        is_correct: isCorr,
                        user_time_spent: this.questionTimeSpent[qId] || 0
                    };
                });

                const accuracy = (correctCount + wrongCount) > 0 ? (correctCount / (correctCount + wrongCount) * 100) : 0;

                const practiceResult = {
                    quiz_set_id: this.quizId,
                    summary: {
                        score: score,
                        rank: '-',
                        total_participants: '-',
                        percentile: '-',
                        accuracy: Math.round(accuracy),
                        time_spent_seconds: timeSpent,
                        correct: correctCount,
                        wrong: wrongCount,
                        unattempted: unattemptedCount
                    },
                    solutions: localSolutions
                };

                sessionStorage.setItem('practiceResult', JSON.stringify(practiceResult));
                try {
                    localStorage.setItem(`quiz_times_${this.quizId}`, JSON.stringify(this.questionTimeSpent));
                } catch (e) {}

                return { practice: true, result: practiceResult };
            }

            // Real Exam Live Submission
            const formattedResponses = this.questions.map(q => {
                const qId = q.question_id || q.id;
                return {
                    question_id: qId,
                    selected_index: this.responses[qId] !== undefined ? this.responses[qId] : null,
                    time_spent: this.questionTimeSpent[qId] || 0
                };
            });

            const headers = window.PlatformBridge 
                ? window.PlatformBridge.getAuthHeaders({ 'Content-Type': 'application/json' }) 
                : { 'Content-Type': 'application/json' };

            const response = await fetch(`${API_BASE}/api/quiz/submit`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    attempt_id: this.attemptId,
                    user_id: this.userId,
                    responses: formattedResponses,
                    time_spent_seconds: timeSpent
                })
            });

            if (!response.ok) throw new Error(`Submission failed (HTTP ${response.status})`);
            const data = await response.json();

            return {
                practice: false,
                attempt_id: this.attemptId,
                data: data
            };
        }
    }

    // Attach to global window object
    window.QuizEngine = QuizEngine;

})(window);
