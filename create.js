document.addEventListener('DOMContentLoaded', () => {
    const sheetNameInput = document.getElementById('sheet-name');
    const questionTypeInput = document.getElementById('question-type');
    const questionInput = document.getElementById('question');
    const optionsInput = document.getElementById('options');
    const answerInput = document.getElementById('answer');
    const pointsInput = document.getElementById('points');
    const addQuestionButton = document.getElementById('add-question');
    const downloadButton = document.getElementById('download-xlsx');
    const fileNameInput = document.getElementById('file-name');

    const sheetTabsContainer = document.getElementById('sheet-tabs');
    const previewBody = document.getElementById('question-preview-body');
    const summarySection = document.getElementById('summary-section');

    let questionData = {};
    let activeSheet = '';
    let editIndex = null;

    function loadFromStorage() {
        const savedData = localStorage.getItem('questionCreatorData');
        const savedSheet = localStorage.getItem('questionCreatorActiveSheet');
        if (savedData) {
            questionData = JSON.parse(savedData);
            activeSheet = savedSheet || (Object.keys(questionData)[0] || 'Sheet1');
        } else {
            questionData = { 'Sheet1': [] };
            activeSheet = 'Sheet1';
        }
        setActiveSheet(activeSheet);
    }

    function saveToStorage() {
        localStorage.setItem('questionCreatorData', JSON.stringify(questionData));
        localStorage.setItem('questionCreatorActiveSheet', activeSheet);
    }

    function setActiveSheet(name) {
        if (!name) return;
        activeSheet = name;
        if (!questionData[activeSheet]) {
            questionData[activeSheet] = [];
        }
        sheetNameInput.value = activeSheet;
        renderTabs();
        renderPreview();
        updateSummary();
        saveToStorage();
    }

    function renderTabs() {
        sheetTabsContainer.innerHTML = '';
        const newSheetInput = document.createElement('input');
        newSheetInput.type = 'text';
        newSheetInput.placeholder = 'New Sheet Name';
        newSheetInput.onkeypress = (e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
                setActiveSheet(e.target.value.trim());
                e.target.value = '';
            }
        };
        sheetTabsContainer.appendChild(newSheetInput);

        for (const sheetName in questionData) {
            const tabButton = document.createElement('button');
            tabButton.textContent = sheetName;
            tabButton.className = sheetName === activeSheet ? 'active' : '';
            tabButton.onclick = () => setActiveSheet(sheetName);
            sheetTabsContainer.appendChild(tabButton);
        }
    }

    function renderPreview() {
        previewBody.innerHTML = '';
        if (!questionData[activeSheet]) return;

        questionData[activeSheet].forEach((q, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${q.type}</td>
                <td>${q.question}</td>
                <td>${q.options.replace(/;/g, '; ')}</td>
                <td>${q.answer}</td>
                <td>${q.points}</td>
                <td class="actions">
                    <button onclick="editQuestion(${index})">Edit</button>
                    <button onclick="deleteQuestion(${index})">Delete</button>
                </td>
            `;
            previewBody.appendChild(row);
        });
    }

    function updateSummary() {
        if (!questionData[activeSheet]) {
            summarySection.textContent = 'Warm-up: 0 | Assessment: 0';
            return;
        }
        const warmupCount = questionData[activeSheet].filter(q => q.type === 'warmup').length;
        const assessmentCount = questionData[activeSheet].filter(q => q.type === 'assessment').length;
        summarySection.textContent = `Warm-up: ${warmupCount} | Assessment: ${assessmentCount}`;
    }

    function clearForm() {
        questionInput.value = '';
        optionsInput.value = '';
        answerInput.value = '';
        pointsInput.value = '10';
        questionTypeInput.selectedIndex = 0;
        questionInput.focus();
        addQuestionButton.textContent = 'Add Question';
        editIndex = null;
    }

    window.editQuestion = (index) => {
        const question = questionData[activeSheet][index];
        if (question) {
            questionTypeInput.value = question.type;
            questionInput.value = question.question;
            optionsInput.value = question.options;
            answerInput.value = question.answer;
            pointsInput.value = question.points;

            addQuestionButton.textContent = 'Update Question';
            editIndex = index;
            window.scrollTo(0, 0);
        }
    };

    function deleteQuestion(index) {
        if (confirm('Are you sure you want to delete this question?')) {
            questionData[activeSheet].splice(index, 1);
            renderPreview();
            updateSummary();
            saveToStorage();
        }
    };

    addQuestionButton.addEventListener('click', () => {
        const sheetName = sheetNameInput.value.trim();
        if (!sheetName) {
            alert('Please enter a sheet name.');
            return;
        }

        if (activeSheet !== sheetName) {
            setActiveSheet(sheetName);
        }

        const question = {
            type: questionTypeInput.value,
            question: questionInput.value.trim(),
            options: optionsInput.value.trim(),
            answer: answerInput.value.trim(),
            points: parseInt(pointsInput.value) || 0
        };

        if (!question.question || !question.answer) {
            alert('Question and Answer fields are required.');
            return;
        }

        if (editIndex !== null) {
            questionData[activeSheet][editIndex] = question;
        } else {
            questionData[activeSheet].push(question);
        }
        
        renderPreview();
        updateSummary();
        saveToStorage();
        clearForm();
    });

    downloadButton.addEventListener('click', () => {
        const fileName = (fileNameInput.value.trim() || 'assessment-questions') + '.xlsx';
        const wb = XLSX.utils.book_new();

        for (const sheetName in questionData) {
            if (questionData[sheetName].length > 0) {
                const ws = XLSX.utils.json_to_sheet(questionData[sheetName], {
                    header: ['type', 'question', 'options', 'answer', 'points']
                });
                XLSX.utils.book_append_sheet(wb, ws, sheetName);
            }
        }

        if (wb.SheetNames.length === 0) {
            alert('No questions have been added. Please add at least one question before downloading.');
            return;
        }

        XLSX.writeFile(wb, fileName);
    });

    // Initialize and load data
    loadFromStorage();
});