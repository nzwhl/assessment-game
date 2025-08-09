document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('xlsx-file');
    const sheetsSection = document.getElementById('sheets-section');
    const sheetButtonsContainer = document.getElementById('sheet-buttons');
    const previewSection = document.getElementById('preview-section');
    const jsonPreview = document.getElementById('json-preview');
    const downloadButton = document.getElementById('download-json');
    const startGameButton = document.getElementById('start-game');

    let workbook;
    let finalJson = [];
    let originalFilename = '';
    let selectedSheetName = '';

    function loadFromStorage() {
        const fileDataUrl = localStorage.getItem('importerFileData');
        const filename = localStorage.getItem('importerFilename');
        const selectedSheet = localStorage.getItem('importerSelectedSheet');

        if (fileDataUrl && filename) {
            originalFilename = filename.replace(/\.[^/.]+$/, ""); // Remove extension
            
            const b64 = fileDataUrl.split(',')[1];
            try {
                workbook = XLSX.read(b64, { type: 'base64' });
                
                sheetButtonsContainer.innerHTML = '';
                workbook.SheetNames.forEach(name => {
                    const button = document.createElement('button');
                    button.textContent = name;
                    button.onclick = () => processSheet(name);
                    sheetButtonsContainer.appendChild(button);
                });

                sheetsSection.style.display = 'block';

                if (selectedSheet && workbook.SheetNames.includes(selectedSheet)) {
                    processSheet(selectedSheet);
                }

            } catch (e) {
                console.error("Error reading workbook from localStorage", e);
                localStorage.removeItem('importerFileData');
                localStorage.removeItem('importerFilename');
                localStorage.removeItem('importerSelectedSheet');
            }
        }
    }

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        originalFilename = file.name.replace(/\.[^/.]+$/, ""); // Capture filename without extension

        const reader = new FileReader();
        reader.onload = (event) => {
            const fileDataUrl = event.target.result;
            
            localStorage.setItem('importerFileData', fileDataUrl);
            localStorage.setItem('importerFilename', file.name);
            localStorage.removeItem('importerSelectedSheet');

            const b64 = fileDataUrl.split(',')[1];
            workbook = XLSX.read(b64, { type: 'base64' });

            sheetButtonsContainer.innerHTML = '';
            workbook.SheetNames.forEach(name => {
                const button = document.createElement('button');
                button.textContent = name;
                button.onclick = () => processSheet(name);
                sheetButtonsContainer.appendChild(button);
            });

            sheetsSection.style.display = 'block';
            previewSection.style.display = 'none';
            downloadButton.style.display = 'none';
            startGameButton.style.display = 'none';
        };
        reader.readAsDataURL(file);
    });

    function processSheet(sheetName) {
        selectedSheetName = sheetName;
        localStorage.setItem('importerSelectedSheet', sheetName);

        Array.from(sheetButtonsContainer.children).forEach(btn => {
            btn.classList.toggle('active', btn.textContent === sheetName);
        });

        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length > 0) {
            const firstRow = jsonData[0];
            const requiredCols = ['type', 'question'];
            if (!requiredCols.every(col => col in firstRow)) {
                alert(`Sheet '${sheetName}' is missing one of the required columns: type, question.`);
                return;
            }
        }

        const warmups = jsonData.filter(q => q.type === 'warmup');
        const assessments = jsonData.filter(q => q.type === 'assessment');
        const challenges = jsonData.filter(q => q.type === 'challenge');
        finalJson = [];

        if (warmups.length > 0) {
            finalJson.push({ type: 'intro-warmup', question: 'Warm-up Round', points: 0 });
            finalJson.push(...warmups.map(formatQuestion));
        }

        if (assessments.length > 0) {
            finalJson.push({ type: 'intro-assessment', question: 'Assessment Round', points: 0 });
            finalJson.push(...assessments.map(formatQuestion));
        }

        if (challenges.length > 0) {
            finalJson.push({ type: 'intro-challenge', question: 'Challenge Round', points: 0 });
            finalJson.push(...challenges.map(formatQuestion));
        }

        jsonPreview.textContent = JSON.stringify(finalJson, null, 2);
        previewSection.style.display = 'block';
        downloadButton.style.display = 'inline-block';
        startGameButton.style.display = 'inline-block';
    }

    function formatQuestion(q) {
        const formatted = {
            type: q.type,
            question: q.question,
            points: q.points
        };
        if (q.options && q.options.trim()) {
            formatted.options = q.options.split(';').map(opt => opt.trim());
        }
        formatted.answer = q.answer;
        return formatted;
    }

    startGameButton.addEventListener('click', () => {
        localStorage.setItem('questionsForGame', JSON.stringify(finalJson));
        window.open('host.html', '_blank');
    });

    downloadButton.addEventListener('click', () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const timestamp = `${year}${month}${day}${hours}${minutes}`;

        const downloadFilename = `${originalFilename}_${selectedSheetName}_${timestamp}.json`;

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(finalJson, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", downloadFilename);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    });

    loadFromStorage();
});