document.addEventListener('DOMContentLoaded', () => {
    const rulesContainer = document.getElementById('rules-container');
    const gameContainer = document.getElementById('game-container');
    const questionText = document.getElementById('question-text');
    const gamePhase = document.getElementById('game-phase');
    const playersContainer = document.getElementById('players-container');

    // Function to load rules
    function loadRules() {
        return fetch('rules.html')
            .then(response => response.text())
            .then(data => {
                rulesContainer.innerHTML = data;
            });
    }

    // Main function to update the entire display
    function updateDisplay() {
        const gameStarted = localStorage.getItem('gameStarted') === 'true';
        console.log('Display: updateDisplay called. gameStarted:', gameStarted);
        const questions = JSON.parse(localStorage.getItem('questions')) || [];

        if (gameStarted) {
            if (questions.length === 0) {
                // If gameStarted is true but no questions are loaded, show rules and reset gameStarted
                rulesContainer.style.display = 'block';
                gameContainer.style.display = 'none';
                localStorage.removeItem('gameStarted');
                localStorage.removeItem('questions');
                localStorage.removeItem('currentQuestionIndex');
                localStorage.removeItem('players');
                localStorage.removeItem('showAnswer');
                localStorage.removeItem('showScoreTable');
                return; // Exit the function early
            }
            // Game is active, show the game board
            rulesContainer.style.display = 'none';
            gameContainer.style.display = 'block';
            const currentQuestionIndex = parseInt(localStorage.getItem('currentQuestionIndex')) || 0;
            const players = JSON.parse(localStorage.getItem('players')) || [];
            const scoreTableContainer = document.getElementById('score-table-container');
            const showScoreTable = localStorage.getItem('showScoreTable') === 'true';

            // Clear previous player rows
            playersContainer.innerHTML = '';

            // Update the question display
            if (questions.length > 0 && questions[currentQuestionIndex]) {
                const question = questions[currentQuestionIndex];

                

                

                // Handle intro cards
                if (question.type.startsWith('intro-')) {
                    gamePhase.textContent = ''; // Clear phase text for intro cards
                    questionText.innerHTML = `<h1 class="intro-card">${question.question}</h1>`;
                    playersContainer.style.display = 'none'; // Hide players for intro cards
                    document.getElementById('point-scale-container').style.display = 'none';
                    scoreTableContainer.style.display = 'none'; // Hide score table for intro cards
                } else {
                    gamePhase.textContent = question.type === 'warmup' ? 'Warm-up Round' : (question.type === 'assessment' ? 'Assessment Task' : 'Challenge Task');
                    playersContainer.style.display = 'block'; // Show players for regular questions
                    document.getElementById('point-scale-container').style.display = 'block';
                    scoreTableContainer.style.display = showScoreTable ? 'block' : 'none'; // Control visibility based on flag

                    let questionHTML = `<p>${question.question}</p><p class="question-points">[${question.points} points]</p>`;
                    if (question.options) {
                        questionHTML += '<ul class="options-list">';
                        question.options.forEach(option => {
                            const isCorrect = question.answer === option;
                            const showAnswer = localStorage.getItem('showAnswer') === 'true';
                            let liClass = '';
                            let checkmark = '';
                            if (showAnswer && isCorrect) {
                                liClass = 'correct-answer';
                                checkmark = ' &#10004;'; // Checkmark symbol
                            }
                            questionHTML += `<li class="${liClass}">${option}${checkmark}</li>`;
                        });
                        questionHTML += '</ul>';
                    } else {
                        // For non-multiple choice questions, show answer directly below
                        const showAnswer = localStorage.getItem('showAnswer') === 'true';
                        if (showAnswer) {
                            questionHTML += `<p class="answer-text"><strong>Answer:</strong> ${question.answer}</p>`;
                        }
                    }
                    questionText.innerHTML = questionHTML;

                    // Display question index
                    const warmUpQuestions = questions.filter(q => q.type === 'warmup');
                    const assessmentQuestions = questions.filter(q => q.type === 'assessment');

                    let currentIndex = 0;
                    let totalQuestions = 0;
                    let phaseText = '';

                    if (question.type === 'warmup') {
                        currentIndex = warmUpQuestions.indexOf(question) + 1;
                        totalQuestions = warmUpQuestions.length;
                        phaseText = 'warm up questions';
                    } else if (question.type === 'assessment') {
                        currentIndex = assessmentQuestions.indexOf(question) + 1;
                        totalQuestions = assessmentQuestions.length;
                        phaseText = 'assessment questions';
                    } else if (question.type === 'challenge') {
                        const challengeQuestions = questions.filter(q => q.type === 'challenge');
                        currentIndex = challengeQuestions.indexOf(question) + 1;
                        totalQuestions = challengeQuestions.length;
                        phaseText = 'challenges';
                    }
                    gamePhase.textContent += ` (${currentIndex}/${totalQuestions} ${phaseText})`;
                }
            } else {
                // Fallback if no questions are loaded or index is out of bounds
                gamePhase.textContent = '';
                questionText.innerHTML = '<p>No questions loaded. Please start a game from the host page.</p>';
                playersContainer.style.display = 'none';
                document.getElementById('point-scale-container').style.display = 'none';
                scoreTableContainer.style.display = 'none';
            }

            // Update the player progress bars
            players.forEach(player => {
                const playerRow = document.createElement('div');
                playerRow.className = 'player-row';

                const playerInfo = document.createElement('div');
                playerInfo.className = 'player-info';

                const playerName = document.createElement('div');
                playerName.className = 'player-name-display';
                playerName.textContent = player.name;

                const barContainer = document.createElement('div');
                barContainer.className = 'progress-bar-container';

                const bar = document.createElement('div');
                bar.className = 'progress-bar';

                const avatar = document.createElement('div');
                avatar.className = 'player-avatar-marker';
                avatar.textContent = player.initials;
                avatar.style.backgroundColor = player.color;
                avatar.style.left = `calc(${(player.score / 120) * 100}% - 18px)`;

                barContainer.appendChild(bar);
                barContainer.appendChild(avatar);
                playerInfo.appendChild(playerName);
                playerInfo.appendChild(barContainer);
                playerRow.appendChild(playerInfo);
                playersContainer.appendChild(playerRow);
            });

            // Score Table Display
            if (showScoreTable) {
                const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

                let tableHTML = '<table class="score-table"><thead><tr><th>Rank</th><th>Player</th><th>Score</th></tr></thead><tbody>';
                sortedPlayers.forEach((player, index) => {
                    tableHTML += `<tr><td>${index + 1}</td><td>${player.name}</td><td>${player.score}</td></tr>`;
                });
                tableHTML += '</tbody></table>';
                scoreTableContainer.innerHTML = tableHTML;
            } else {
                scoreTableContainer.innerHTML = ''; // Hide table
            }

        } else {
            // Game has not started, show the rules
            rulesContainer.style.display = 'block';
            gameContainer.style.display = 'none';
        }
    }

    // Listen for changes from the host page
    window.addEventListener('storage', (event) => {
        if (event.key === 'update' || event.key === 'gameStarted') {
            updateDisplay();
        }
    });

    // Initial setup
    loadRules().then(() => {
        console.log('Display: Initial load, calling updateDisplay');
        updateDisplay();
    });
});