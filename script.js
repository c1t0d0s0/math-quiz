// --- DOM要素の取得 ---
const questionEl = document.getElementById('question');
const optionsEl = document.getElementById('options');
const timerEl = document.getElementById('timer');
const resultContainerEl = document.getElementById('result-container');
const quizContainerEl = document.getElementById('quiz-container');
const scoreEl = document.getElementById('score');
const restartButton = document.getElementById('restart-button');
const finalScoreEl = document.getElementById('final-score');
const startContainer = document.getElementById('start-container');
const backToStartButton = document.getElementById('back-to-start-button');
const newRecordBannerEl = document.getElementById('new-record-banner');
const modeResultInfoEl = document.getElementById('mode-result-info');

// モードボタン
const modeAdditionButton = document.getElementById('mode-addition');
const modeMultiplicationButton = document.getElementById('mode-multiplication');
const modeDivisionButton = document.getElementById('mode-division');
const modeDecimalsButton = document.getElementById('mode-decimals');
const modeFractionsButton = document.getElementById('mode-fractions');
const modeMixedButton = document.getElementById('mode-mixed');

// 学年タブボタン
const gradeTabs = document.querySelectorAll('.grade-tab');
const modeCards = document.querySelectorAll('.mode-card');

// --- クイズの設定 ---
const MODE_SETTINGS = {
    addition: { timeLimit: 60, name: '足し算・引き算' },
    multiplication: { timeLimit: 180, name: 'かけ算' },
    division: { timeLimit: 120, name: '割り算' },
    decimals: { timeLimit: 120, name: '小数' },
    fractions: { timeLimit: 120, name: '分数' },
    mixed: { timeLimit: 120, name: '全部ミックス' }
};

// --- クイズの状態を管理する変数 ---
let score = 0;
let timer;
let timeLeft = 60;
let currentQuestion = null;
let currentMode = 'addition';
let questionsAsked = 0;

// --- 学年フィルター機能 ---
gradeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        gradeTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const selectedGrade = tab.getAttribute('data-grade');
        modeCards.forEach(card => {
            const cardGrades = card.getAttribute('data-grade').split(' ');
            if (selectedGrade === 'all' || cardGrades.includes(selectedGrade) || cardGrades.includes('all')) {
                card.classList.remove('hidden-by-filter');
            } else {
                card.classList.add('hidden-by-filter');
            }
        });
    });
});

// --- ハイスコアの読込と表示 ---
function loadHighScores() {
    Object.keys(MODE_SETTINGS).forEach(mode => {
        const key = `math_quiz_highscore_${mode}`;
        const savedScore = localStorage.getItem(key) || 0;
        const el = document.getElementById(`highscore-${mode}`);
        if (el) {
            el.textContent = savedScore;
        }
    });
}

/**
 * たしざん・ひきざんの問題を生成
 */
function generateAdditionQuestion() {
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;
    const operator = Math.random() < 0.5 ? '+' : '-';
    let questionText, correctAnswer;

    if (operator === '+' || num1 >= num2) {
        questionText = `${num1} ${operator} ${num2} = ?`;
        correctAnswer = operator === '+' ? num1 + num2 : num1 - num2;
    } else {
        questionText = `${num2} - ${num1} = ?`;
        correctAnswer = num2 - num1;
    }

    const options = new Set([correctAnswer]);
    while (options.size < 4) {
        const wrong = Math.max(0, correctAnswer + (Math.floor(Math.random() * 11) - 5));
        if (wrong !== correctAnswer) {
            options.add(wrong);
        }
    }

    return {
        question: questionText,
        options: Array.from(options).sort(() => Math.random() - 0.5),
        answer: correctAnswer
    };
}

/**
 * かけざんの問題を生成
 */
function generateMultiplicationQuestion() {
    let num1, num2, type;
    const rand = Math.random();

    if (questionsAsked <= 5) {
        type = rand < 0.50 ? '1x1' : (rand < 0.90 ? '1x2' : '2x2');
    } else if (questionsAsked <= 12) {
        type = rand < 0.20 ? '1x1' : (rand < 0.70 ? '1x2' : '2x2');
    } else if (questionsAsked <= 20) {
        type = rand < 0.10 ? '1x1' : (rand < 0.50 ? '1x2' : '2x2');
    } else {
        type = rand < 0.20 ? '1x2' : '2x2';
    }

    const getSingleDigit = () => Math.floor(Math.random() * 9) + 1;
    const getDoubleDigit = () => Math.floor(Math.random() * 11) + 10;

    if (type === '1x1') {
        num1 = getSingleDigit();
        num2 = getSingleDigit();
    } else if (type === '1x2') {
        if (Math.random() < 0.5) {
            num1 = getSingleDigit();
            num2 = getDoubleDigit();
        } else {
            num1 = getDoubleDigit();
            num2 = getSingleDigit();
        }
    } else {
        num1 = getDoubleDigit();
        num2 = getDoubleDigit();
    }

    const questionText = `${num1} × ${num2} = ?`;
    const correctAnswer = num1 * num2;

    const options = new Set([correctAnswer]);
    const steps = [-30, -20, -10, 10, 20, 30];
    while (options.size < 2) {
        const randomStep = steps[Math.floor(Math.random() * steps.length)];
        const wrongAnswer = correctAnswer + randomStep;
        if (wrongAnswer > 0 && wrongAnswer !== correctAnswer) {
            options.add(wrongAnswer);
        }
    }

    while (options.size < 4) {
        const wrongAnswer = Math.max(1, correctAnswer + (Math.floor(Math.random() * 61) - 30));
        if (wrongAnswer !== correctAnswer) {
            options.add(wrongAnswer);
        }
    }

    return {
        question: questionText,
        options: Array.from(options).sort(() => Math.random() - 0.5),
        answer: correctAnswer
    };
}

/**
 * わりざんの問題を生成（割り切れ・あまりあり）
 */
function generateDivisionQuestion() {
    const isRemainder = Math.random() < 0.35; // 35%あまりあり問題
    let questionText, correctAnswer;

    if (!isRemainder) {
        // 割り切れる問題
        const divisor = Math.floor(Math.random() * 9) + 2; // 2〜10
        const quotient = Math.floor(Math.random() * 9) + 1; // 1〜9
        const dividend = divisor * quotient;

        questionText = `${dividend} ÷ ${divisor} = ?`;
        correctAnswer = quotient;

        const options = new Set([correctAnswer]);
        while (options.size < 4) {
            const wrong = Math.max(1, correctAnswer + (Math.floor(Math.random() * 9) - 4));
            if (wrong !== correctAnswer) {
                options.add(wrong);
            }
        }

        return {
            question: questionText,
            options: Array.from(options).sort(() => Math.random() - 0.5),
            answer: correctAnswer
        };
    } else {
        // あまりのある問題
        const divisor = Math.floor(Math.random() * 8) + 2; // 2〜9
        const quotient = Math.floor(Math.random() * 8) + 1; // 1〜8
        const remainder = Math.floor(Math.random() * (divisor - 1)) + 1; // 1〜(divisor-1)
        const dividend = divisor * quotient + remainder;

        questionText = `${dividend} ÷ ${divisor} = ?`;
        correctAnswer = `${quotient} あまり ${remainder}`;

        const options = new Set([correctAnswer]);
        // 誤答生成（商違い・あまり違い）
        options.add(`${quotient} あまり ${Math.max(0, remainder - 1 || 1)}`);
        options.add(`${Math.max(1, quotient + 1)} あまり ${remainder}`);
        options.add(`${Math.max(1, quotient - 1)} あまり ${remainder}`);

        while (options.size < 4) {
            const wQ = Math.max(1, quotient + Math.floor(Math.random() * 5) - 2);
            const wR = Math.floor(Math.random() * (divisor - 1)) + 1;
            const wrongStr = `${wQ} あまり ${wR}`;
            if (wrongStr !== correctAnswer) {
                options.add(wrongStr);
            }
        }

        return {
            question: questionText,
            options: Array.from(options).sort(() => Math.random() - 0.5),
            answer: correctAnswer
        };
    }
}

/**
 * しょうすうの問題を生成
 */
function generateDecimalsQuestion() {
    const ops = ['+', '-', '×'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let num1, num2, questionText, correctAnswer;

    if (op === '+') {
        num1 = (Math.floor(Math.random() * 89) + 10) / 10; // 1.0〜9.8
        num2 = (Math.floor(Math.random() * 89) + 10) / 10;
        correctAnswer = Math.round((num1 + num2) * 10) / 10;
        questionText = `${num1} + ${num2} = ?`;
    } else if (op === '-') {
        const a = (Math.floor(Math.random() * 89) + 10) / 10;
        const b = (Math.floor(Math.random() * 89) + 10) / 10;
        num1 = Math.max(a, b);
        num2 = Math.min(a, b);
        correctAnswer = Math.round((num1 - num2) * 10) / 10;
        questionText = `${num1} - ${num2} = ?`;
    } else {
        // かけ算 (0.X × Y)
        num1 = (Math.floor(Math.random() * 9) + 1) / 10; // 0.1〜0.9
        num2 = Math.floor(Math.random() * 9) + 2; // 2〜10
        correctAnswer = Math.round((num1 * num2) * 10) / 10;
        questionText = `${num1} × ${num2} = ?`;
    }

    const options = new Set([correctAnswer]);
    const diffs = [-0.2, -0.1, 0.1, 0.2, 0.5, -0.5, 1.0];
    while (options.size < 4) {
        const diff = diffs[Math.floor(Math.random() * diffs.length)];
        const wrong = Math.round((correctAnswer + diff) * 10) / 10;
        if (wrong > 0 && wrong !== correctAnswer) {
            options.add(wrong);
        }
    }

    return {
        question: questionText,
        options: Array.from(options).sort(() => Math.random() - 0.5),
        answer: correctAnswer
    };
}

/**
 * ぶんすうの問題を生成（同分母のたし算・ひき算）
 */
function generateFractionsQuestion() {
    const denominator = Math.floor(Math.random() * 7) + 3; // 分母 3〜9
    const op = Math.random() < 0.5 ? '+' : '-';
    let num1, num2, resultNum, questionText, correctAnswer;

    if (op === '+') {
        num1 = Math.floor(Math.random() * (denominator - 2)) + 1;
        num2 = Math.floor(Math.random() * (denominator - num1 - 1)) + 1;
        resultNum = num1 + num2;
        questionText = `${num1}/${denominator} + ${num2}/${denominator} = ?`;
    } else {
        num1 = Math.floor(Math.random() * (denominator - 2)) + 2;
        num2 = Math.floor(Math.random() * (num1 - 1)) + 1;
        resultNum = num1 - num2;
        questionText = `${num1}/${denominator} - ${num2}/${denominator} = ?`;
    }

    correctAnswer = `${resultNum}/${denominator}`;
    const options = new Set([correctAnswer]);

    // 誤答の生成（分子だけ変える、または分母も足してしまう定番ミス）
    if (op === '+') {
        options.add(`${resultNum}/${denominator + denominator}`); // 分母も足してしまうミス
    }
    
    while (options.size < 4) {
        const wrongResultNum = Math.max(1, resultNum + (Math.floor(Math.random() * 5) - 2));
        const wrongOption = `${wrongResultNum}/${denominator}`;
        if (wrongOption !== correctAnswer) {
            options.add(wrongOption);
        }
    }

    return {
        question: questionText,
        options: Array.from(options).sort(() => Math.random() - 0.5),
        answer: correctAnswer
    };
}

/**
 * 現在のモードに応じて問題を生成
 */
function generateQuestion() {
    let modeToUse = currentMode;
    if (currentMode === 'mixed') {
        const modes = ['addition', 'multiplication', 'division', 'decimals', 'fractions'];
        modeToUse = modes[Math.floor(Math.random() * modes.length)];
    }

    switch (modeToUse) {
        case 'addition':
            return generateAdditionQuestion();
        case 'multiplication':
            return generateMultiplicationQuestion();
        case 'division':
            return generateDivisionQuestion();
        case 'decimals':
            return generateDecimalsQuestion();
        case 'fractions':
            return generateFractionsQuestion();
        default:
            return generateAdditionQuestion();
    }
}

/**
 * クイズの問題を画面に表示
 */
function displayQuestion() {
    questionsAsked++;
    currentQuestion = generateQuestion();
    questionEl.textContent = currentQuestion.question;
    optionsEl.innerHTML = '';

    currentQuestion.options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option;
        button.classList.add('option');
        button.addEventListener('click', () => handleAnswer(option, button));
        optionsEl.appendChild(button);
    });
}

/**
 * ゲームタイマーを更新
 */
function updateTimer() {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
        clearInterval(timer);
        showResults();
    }
}

/**
 * タイマー表示を更新
 */
function updateTimerDisplay() {
    if (timeLeft >= 60) {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const secondsStr = seconds < 10 ? '0' + seconds : seconds;
        timerEl.textContent = `残り時間: ${minutes}分${secondsStr}秒`;
    } else {
        timerEl.textContent = `残り時間: ${timeLeft}秒`;
    }
}

/**
 * 回答選択時の処理
 */
function handleAnswer(selectedOption, selectedButton) {
    const correctAnswer = currentQuestion.answer;
    const optionButtons = optionsEl.querySelectorAll('.option');
    optionButtons.forEach(btn => btn.disabled = true);

    if (String(selectedOption) === String(correctAnswer)) {
        score++;
        scoreEl.textContent = score;
        selectedButton.classList.add('correct');
        setTimeout(() => {
            displayQuestion();
        }, 400);
    } else {
        selectedButton.classList.add('incorrect');
        optionButtons.forEach(btn => {
            if (String(btn.textContent) === String(correctAnswer)) {
                btn.classList.add('correct');
            }
        });
        setTimeout(() => {
            displayQuestion();
        }, 1300);
    }
}

/**
 * 最終結果を表示
 */
function showResults() {
    quizContainerEl.classList.add('hidden');
    resultContainerEl.classList.remove('hidden');
    finalScoreEl.textContent = `${score}問`;

    const modeInfo = MODE_SETTINGS[currentMode] || { name: 'クイズ' };
    modeResultInfoEl.textContent = `モード: ${modeInfo.name}`;

    // ハイスコアチェックと保存
    const key = `math_quiz_highscore_${currentMode}`;
    const previousHighScore = parseInt(localStorage.getItem(key) || '0', 10);

    if (score > previousHighScore) {
        localStorage.setItem(key, score);
        newRecordBannerEl.classList.remove('hidden');
    } else {
        newRecordBannerEl.classList.add('hidden');
    }

    loadHighScores();
}

/**
 * クイズを開始
 */
function startQuiz(mode) {
    if (mode) {
        currentMode = mode;
    }
    score = 0;
    questionsAsked = 0;
    const setting = MODE_SETTINGS[currentMode] || { timeLimit: 60 };
    timeLeft = setting.timeLimit;
    scoreEl.textContent = score;

    startContainer.classList.add('hidden');
    resultContainerEl.classList.add('hidden');
    quizContainerEl.classList.remove('hidden');

    updateTimerDisplay();
    displayQuestion();

    clearInterval(timer);
    timer = setInterval(updateTimer, 1000);
}

/**
 * スタート画面に戻る
 */
function showStartScreen() {
    clearInterval(timer);
    quizContainerEl.classList.add('hidden');
    resultContainerEl.classList.add('hidden');
    startContainer.classList.remove('hidden');
    loadHighScores();
}

// --- イベントリスナーの登録 ---
modeAdditionButton.addEventListener('click', () => startQuiz('addition'));
modeMultiplicationButton.addEventListener('click', () => startQuiz('multiplication'));
modeDivisionButton.addEventListener('click', () => startQuiz('division'));
modeDecimalsButton.addEventListener('click', () => startQuiz('decimals'));
modeFractionsButton.addEventListener('click', () => startQuiz('fractions'));
modeMixedButton.addEventListener('click', () => startQuiz('mixed'));

restartButton.addEventListener('click', () => startQuiz(currentMode));
backToStartButton.addEventListener('click', showStartScreen);

// 初期化
loadHighScores();