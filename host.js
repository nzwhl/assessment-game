document.addEventListener('DOMContentLoaded', () => {
    // Password protection
    const password = localStorage.getItem('gamePassword');
    if (password) {
        const enteredPassword = prompt('Enter the password to access the host panel:');
        if (enteredPassword !== password) {
            alert('Incorrect password. You will be redirected to the main page.');
            window.location.href = 'index.html';
            return;
        }
    }

    // Setup section
    const playerNameInput = document.getElementById('player-name');
    const addPlayerButton = document.getElementById('add-player');
    const startGameButton = document.getElementById('start-game');
    const loadQuestionsButton = document.getElementById('load-questions-button');
    const jsonFileInput = document.getElementById('json-file-input');
    const fileNameDisplay = document.getElementById('file-name-display');
    const loadQuestionsSection = document.getElementById('load-questions-section');
    const questionsLoadedMessage = document.getElementById('questions-loaded-message');

    // Game section
    const setupSection = document.getElementById('setup-section');
    const gameSection = document.getElementById('game-section');
    const currentPhase = document.getElementById('current-phase');
    const refQuestion = document.getElementById('ref-question');
    const refAnswer = document.getElementById('ref-answer');
    const playerControls = document.getElementById('player-controls');
    const prevQuestionButton = document.getElementById('prev-question');
    const showAnswerButton = document.getElementById('show-answer');
    const nextQuestionButton = document.getElementById('next-question');
    const showScoreButton = document.getElementById('show-score');

    let players = JSON.parse(localStorage.getItem('players')) || [];
    let questions = []; // Initialize as empty, will be loaded or fetched
    let currentQuestionIndex = parseInt(localStorage.getItem('currentQuestionIndex')) || 0;
    let gameStarted = localStorage.getItem('gameStarted') === 'true';

    // Player list display
    const playerList = document.getElementById('player-list');

    // Check if game was already started on load
    if (gameStarted) {
        setupSection.style.display = 'none';
        gameSection.style.display = 'block';
        questions = JSON.parse(localStorage.getItem('questions')) || [];
        updateHostView();
    } else {
        // Check if questions are pre-loaded from importer
        if (localStorage.getItem('questionsForGame')) {
            loadQuestionsSection.style.display = 'none';
            questionsLoadedMessage.style.display = 'block';
        } else {
            loadQuestionsSection.style.display = 'block';
            questionsLoadedMessage.style.display = 'none';
        }
        renderPlayerList();
    }

    loadQuestionsButton.addEventListener('click', () => {
        jsonFileInput.click();
    });

    jsonFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    questions = JSON.parse(e.target.result);
                    fileNameDisplay.textContent = file.name;
                } catch (error) {
                    alert('Error parsing JSON file.');
                    console.error('JSON Parse Error:', error);
                }
            };
            reader.readAsText(file);
        }
    });

    function addPlayer() {
        const name = playerNameInput.value.trim();
        if (name) {
            const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
            const color = `hsl(${Math.random() * 360}, 70%, 50%)`;
            players.push({ name, initials, color, score: 60 });
            playerNameInput.value = '';
            localStorage.setItem('players', JSON.stringify(players));
            renderPlayerList();
        }
    }

    addPlayerButton.addEventListener('click', addPlayer);

    playerNameInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            addPlayer();
        }
    });

    function renderPlayerList() {
        playerList.innerHTML = '';
        players.forEach((player, index) => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<span>${index + 1}. ${player.name}</span>`;

            const moveUpButton = document.createElement('button');
            moveUpButton.textContent = 'Up';
            moveUpButton.onclick = () => movePlayer(index, -1);
            moveUpButton.disabled = index === 0;

            const moveDownButton = document.createElement('button');
            moveDownButton.textContent = 'Down';
            moveDownButton.onclick = () => movePlayer(index, 1);
            moveDownButton.disabled = index === players.length - 1;

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.onclick = () => deletePlayer(index);

            listItem.appendChild(moveUpButton);
            listItem.appendChild(moveDownButton);
            listItem.appendChild(deleteButton);
            playerList.appendChild(listItem);
        });
    }

    function movePlayer(index, direction) {
        const newIndex = index + direction;
        if (newIndex >= 0 && newIndex < players.length) {
            const [movedPlayer] = players.splice(index, 1);
            players.splice(newIndex, 0, movedPlayer);
            localStorage.setItem('players', JSON.stringify(players));
            renderPlayerList();
        }
    }

    function deletePlayer(index) {
        if (confirm(`Are you sure you want to delete ${players[index].name}?`)) {
            players.splice(index, 1);
            localStorage.setItem('players', JSON.stringify(players));
            renderPlayerList();
        }
    }

    startGameButton.addEventListener('click', () => {
        const password = document.getElementById('game-password').value;
        if (password.length < 5) {
            alert('Password must be at least 5 characters long.');
            return;
        }

        if (players.length === 0) {
            alert('Please add at least one player before starting the game.');
            return;
        }

        localStorage.setItem('gamePassword', password);

        const storedQuestions = localStorage.getItem('questionsForGame');

        if (storedQuestions) {
            questions = JSON.parse(storedQuestions);
            localStorage.removeItem('questionsForGame');
            startGameLogic();
        } else if (questions.length > 0) {
            startGameLogic();
        } else {
            alert('Please load a questions file before starting the game.');
        }
    });

    function startGameLogic() {
        localStorage.setItem('questions', JSON.stringify(questions));
        localStorage.setItem('players', JSON.stringify(players));
        localStorage.setItem('currentQuestionIndex', currentQuestionIndex.toString());
        localStorage.setItem('gameStarted', 'true');
        console.log('Host: gameStarted set to true');
        setupSection.style.display = 'none';
        gameSection.style.display = 'block';
        updateHostView();
        localStorage.setItem('update', Date.now()); 
    }

    function updateHostView() {
        const question = questions[currentQuestionIndex];

        if (question.type.startsWith('intro-')) {
            currentPhase.textContent = '';
            refQuestion.textContent = question.question;
            refAnswer.textContent = 'Click Next to Continue';
            playerControls.innerHTML = '';
        } else {
            currentPhase.textContent = question.type === 'warmup' ? 'Warm-up Round' : (question.type === 'assessment' ? 'Assessment Task' : 'Challenge Task');
            refQuestion.textContent = question.question;
            refAnswer.textContent = question.answer;

            const warmUpQuestions = questions.filter(q => q.type === 'warmup');
            const assessmentQuestions = questions.filter(q => q.type === 'assessment');
            const challengeQuestions = questions.filter(q => q.type === 'challenge');

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
                currentIndex = challengeQuestions.indexOf(question) + 1;
                totalQuestions = challengeQuestions.length;
                phaseText = 'challenges';
            }
            currentPhase.textContent += ` (${currentIndex}/${totalQuestions} ${phaseText})`;

            playerControls.innerHTML = '';
            players.forEach((player, index) => {
                const playerDiv = document.createElement('div');
                const playerName = document.createElement('strong');
                playerName.textContent = player.name;
                if (player.score >= 120) {
                    playerName.style.color = 'green';
                }
                playerDiv.appendChild(playerName);
                playerDiv.append(`: ${player.score} points`);


                if (question.type === 'warmup') {
                    const correctButton = document.createElement('button');
                    correctButton.textContent = 'Correct';
                    correctButton.onclick = () => awardPoints(index, 10);
                    playerDiv.appendChild(correctButton);

                    const incorrectButton = document.createElement('button');
                    incorrectButton.textContent = 'Incorrect';
                    incorrectButton.onclick = () => awardPoints(index, -10);
                    playerDiv.appendChild(incorrectButton);
                } else {
                    const pointsInput = document.createElement('input');
                    pointsInput.type = 'number';
                    pointsInput.step = '5';
                    pointsInput.placeholder = 'Points';
                    const awardButton = document.createElement('button');
                    awardButton.textContent = 'Award';
                    if (player.score >= 120) {
                        awardButton.disabled = true;
                        awardButton.style.backgroundColor = 'grey';
                    }
                    awardButton.onclick = () => {
                        const points = parseInt(pointsInput.value);
                        if (!isNaN(points)) {
                            awardPoints(index, points);
                        }
                    };
                    playerDiv.appendChild(pointsInput);
                    playerDiv.appendChild(awardButton);
                }
                playerControls.appendChild(playerDiv);
            });
        }
    }

    function awardPoints(playerIndex, points) {
        players[playerIndex].score += points;
        localStorage.setItem('players', JSON.stringify(players));
        updateHostView();
        localStorage.setItem('update', Date.now()); 
    }

    nextQuestionButton.addEventListener('click', () => {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            localStorage.setItem('currentQuestionIndex', currentQuestionIndex.toString());
            localStorage.setItem('showAnswer', 'false');
            updateHostView();
            localStorage.setItem('update', Date.now());
        }
    });

    prevQuestionButton.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            localStorage.setItem('currentQuestionIndex', currentQuestionIndex.toString());
            localStorage.setItem('showAnswer', 'false');
            updateHostView();
            localStorage.setItem('update', Date.now());
        }
    });

    showAnswerButton.addEventListener('click', () => {
        localStorage.setItem('showAnswer', 'true');
        localStorage.setItem('update', Date.now()); 
    });

    const endGameButton = document.getElementById('end-game');

    showScoreButton.addEventListener('click', () => {
        let showScore = localStorage.getItem('showScoreTable') === 'true';
        showScore = !showScore;
        localStorage.setItem('showScoreTable', showScore.toString());
        showScoreButton.textContent = showScore ? 'Hide Score' : 'Show Score';
        localStorage.setItem('update', Date.now());
    });

    showScoreButton.textContent = localStorage.getItem('showScoreTable') === 'true' ? 'Hide Score' : 'Show Score';

    endGameButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to end the game? This will clear all progress.')) {
            localStorage.setItem('gameStarted', 'false');
            localStorage.setItem('update', Date.now());
            localStorage.clear();
            location.reload();
        }
    });
});