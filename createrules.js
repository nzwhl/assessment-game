document.addEventListener('DOMContentLoaded', () => {
    const gameRulesTextarea = document.getElementById('game-rules');
    const downloadRulesButton = document.getElementById('download-rules');
    const useRulesButton = document.getElementById('use-rules');
    const uploadRulesFileInput = document.getElementById('upload-rules-file');
    const uploadRulesButton = document.getElementById('upload-rules');

    // Load initial rules.txt content
    fetch('rules.txt')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(text => {
            gameRulesTextarea.value = text;
        })
        .catch(error => {
            console.error('Error loading rules.txt:', error);
            gameRulesTextarea.value = 'Failed to load default rules. Please enter rules manually.';
        });

    // Download Rules button click handler
    downloadRulesButton.addEventListener('click', () => {
        const rulesContent = gameRulesTextarea.value;
        const blob = new Blob([rulesContent], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'game-rules.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    });

    // Use These Rules button click handler
    useRulesButton.addEventListener('click', () => {
        const rulesContent = gameRulesTextarea.value;
        localStorage.setItem('customGameRules', rulesContent);
        alert('Custom rules saved and will be used for the game!');
        window.location.href = 'host.html'; // Redirect to host.html
    });

    // Upload Rules button click handler
    uploadRulesButton.addEventListener('click', () => {
        uploadRulesFileInput.click(); // Trigger the file input click
    });

    // Handle file selection for upload
    uploadRulesFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                gameRulesTextarea.value = e.target.result;
                alert('Rules loaded from file!');
            };
            reader.onerror = (e) => {
                console.error('Error reading file:', e);
                alert('Failed to read file.');
            };
            reader.readAsText(file);
        }
    });
});