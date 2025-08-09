document.addEventListener('DOMContentLoaded', () => {
    // Password protection
    const storedPassword = localStorage.getItem('gamePassword');
    if (!storedPassword) {
        alert('No game password found. Access denied.');
        window.location.href = 'index.html';
        return;
    }

    const enteredPassword = prompt('Enter the password to view the report:');
    if (enteredPassword !== storedPassword) {
        alert('Incorrect password. Access denied.');
        window.location.href = 'index.html';
        return;
    }

    const reportHeader = document.getElementById('report-header');
    const reportBody = document.getElementById('report-body');

    const gameLog = JSON.parse(localStorage.getItem('gameLog')) || [];

    if (gameLog.length === 0) {
        reportHeader.innerHTML = '<h1>No game data found.</h1>';
        return;
    }

    const gameTitle = 'Team Skills Assessment';
    const gameDate = new Date(gameLog[0].timestamp).toLocaleString();
    const hostName = localStorage.getItem('hostName') || 'N/A'; // Retrieve host name

    reportHeader.innerHTML = `<h1>${gameTitle}</h1><p>Date: ${gameDate}</p><p>Hosted by: ${hostName}</p>`; // Add host name

    // Create and append the download button
    const downloadReportBtn = document.createElement('button');
    downloadReportBtn.id = 'download-report-btn';
    downloadReportBtn.textContent = 'Download Report';
    reportHeader.appendChild(downloadReportBtn); // Append to reportHeader

    const startGameEvent = gameLog.find(event => event.type === 'startGame');
    const endGameEvent = gameLog.find(event => event.type === 'endGame');

    const players = startGameEvent ? startGameEvent.data.players : [];
    const questions = startGameEvent ? startGameEvent.data.questions : [];

    if (endGameEvent) {
        const gameEndDate = new Date(endGameEvent.timestamp).toLocaleString();
        reportHeader.innerHTML += `<p>End Time: ${gameEndDate}</p>`;
    }

    let finalScores = players.map(p => ({ ...p }));

    if (endGameEvent) {
        finalScores = endGameEvent.data.players;
    } else {
        const awardPointsEvents = gameLog.filter(event => event.type === 'awardPoints');
        awardPointsEvents.forEach(event => {
            finalScores[event.data.playerIndex].score += event.data.points;
        });
    }


    let reportHTML = '<h2>Question Summary</h2>';
    reportHTML += '<table>';
    reportHTML += '<thead><tr><th>Question Type</th><th>Count</th></tr></thead>';
    reportHTML += '<tbody>';

    const warmupCount = questions.filter(q => q.type === 'warmup').length;
    const assessmentCount = questions.filter(q => q.type === 'assessment').length;
    const challengeCount = questions.filter(q => q.type === 'challenge').length;

    reportHTML += `<tr><td>Warm-up Questions</td><td>${warmupCount}</td></tr>`;
    reportHTML += `<tr><td>Assessment Questions</td><td>${assessmentCount}</td></tr>`;
    reportHTML += `<tr><td>Challenge Questions</td><td>${challengeCount}</td></tr>`;
    reportHTML += '</tbody></table>';

    reportHTML += '<h2>Final Scores</h2>';
    reportHTML += '<table>';
    reportHTML += '<thead><tr><th>Player</th><th>Final Score</th></tr></thead>';
    reportHTML += '<tbody>';
    finalScores.forEach(player => {
        reportHTML += `<tr><td>${player.name}</td><td>${player.score}</td></tr>`;
    });
    reportHTML += '</tbody></table>';

    reportHTML += '<h2>Question Breakdown</h2>';

    questions.forEach((question, index) => {
        if (!question.type.startsWith('intro-')) {
            reportHTML += `<div class="question-block">
                <h3>Q${index + 1}: ${question.question}</h3>
                <p><strong>Type:</strong> ${question.type}</p>
                <p><strong>Answer:</strong> ${question.answer || 'N/A'}</p>
                <h4>Events:</h4>
                <ul>`;

            const questionEvents = gameLog.filter(event => event.data.questionIndex === index);

            questionEvents.forEach(event => {
                if (event.type === 'awardPoints') {
                    const player = players[event.data.playerIndex];
                    const points = event.data.points;
                    const style = points < 0 ? 'style="color: red;"' : 'style="color: green;"';
                    reportHTML += `<li ${style}>${player.name} was awarded ${points} points.</li>`;
                } else if (event.type === 'showAnswer') {
                    reportHTML += `<li>The answer was shown.</li>`;
                }
            });

            reportHTML += '</ul></div>';
        }
    });

    reportBody.innerHTML = reportHTML;

    downloadReportBtn.addEventListener('click', () => {
        // Get the entire HTML content of the page
        let fullHtmlContent = document.documentElement.outerHTML;

        // Get the CSS content
        const cssContent = `body {\n    font-family: Arial, sans-serif;\n    line-height: 1.6;\n    color: #333;\n    background-color: #f4f4f4;\n    margin: 0;\n    padding: 20px;\n}\n\n.report-container {\n    max-width: 800px;\n    margin: 0 auto;\n    background-color: #fff;\n    padding: 20px;\n    border-radius: 8px;\n    box-shadow: 0 0 10px rgba(0,0,0,0.1);\n}\n\nh1, h2, h3 {\n    color: #0056b3;\n}\n\ntable {\n    width: 100%;\n    border-collapse: collapse;\n    margin-bottom: 20px;\n}\n\ntable, th, td {\n    border: 1px solid #ddd;\n}\n\nth, td {\n    padding: 8px;\n    text-align: left;\n}\n\nth {\n    background-color: #f2f2f2;\n}\n\n.question-block {\n    margin-bottom: 20px;\n    padding: 15px;\n    background-color: #f9f9f9;\n    border-radius: 5px;\n}`; // This should be dynamically read, but for now, I'll hardcode it.

        // Replace the link to the stylesheet with an embedded style tag
        fullHtmlContent = fullHtmlContent.replace(
            '<link rel="stylesheet" href="report.css">',
            `<style>${cssContent}</style>`
        );

        const blob = new Blob([fullHtmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Generate datetime string for filename
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        const datetimeString = `${year}${month}${day}_${hours}${minutes}${seconds}`;

        a.download = `assessment_report_${datetimeString}.html`; // Append datetime to filename
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
});