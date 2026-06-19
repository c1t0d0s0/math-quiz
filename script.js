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
const modeAdditionButton = document.getElementById('mode-addition');
const modeMultiplicationButton = document.getElementById('mode-multiplication');
const backToStartButton = document.getElementById('back-to-start-button');


// --- クイズの設定 ---
const GAME_TIME_LIMIT = 60; // 制限時間（秒）

// --- クイズの状態を管理する変数 ---
let score = 0;
let timer;
let timeLeft = GAME_TIME_LIMIT;
let currentQuestion = null; // 現在の問題を保持
let currentMode = 'addition'; // 現在のモード ('addition' または 'multiplication')
let questionsAsked = 0; // 出題された問題数

/**
 * 簡単な算数の問題を生成する
 * @returns {object} 問題、選択肢、正解を持つオブジェクト
 */
function generateQuestion() {
    let questionText, correctAnswer;

    if (currentMode === 'multiplication') {
        let num1, num2;
        const rand = Math.random();
        let type; // '1x1', '1x2', '2x2'

        if (questionsAsked <= 5) {
            // 最初は1桁を交えた問題を多めに（1桁×1桁: 50%, 1桁×2桁: 40%, 2桁×2桁: 10%）
            if (rand < 0.50) {
                type = '1x1';
            } else if (rand < 0.90) {
                type = '1x2';
            } else {
                type = '2x2';
            }
        } else if (questionsAsked <= 12) {
            // 徐々に2桁同士を増やしていく（1桁×1桁: 20%, 1桁×2桁: 50%, 2桁×2桁: 30%）
            if (rand < 0.20) {
                type = '1x1';
            } else if (rand < 0.70) {
                type = '1x2';
            } else {
                type = '2x2';
            }
        } else if (questionsAsked <= 20) {
            // 2桁×2桁が半分（1桁×1桁: 10%, 1桁×2桁: 40%, 2桁×2桁: 50%）
            if (rand < 0.10) {
                type = '1x1';
            } else if (rand < 0.50) {
                type = '1x2';
            } else {
                type = '2x2';
            }
        } else {
            // 20問目以降は2桁同士が多め（1桁×1桁: 0%, 1桁×2桁: 20%, 2桁×2桁: 80%）
            if (rand < 0.20) {
                type = '1x2';
            } else {
                type = '2x2';
            }
        }

        const getSingleDigit = () => Math.floor(Math.random() * 9) + 1; // 1〜9
        const getDoubleDigit = () => Math.floor(Math.random() * 11) + 10; // 10〜20

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

        questionText = `${num1} × ${num2} = ?`;
        correctAnswer = num1 * num2;
    } else {
        const num1 = Math.floor(Math.random() * 20) + 1;
        const num2 = Math.floor(Math.random() * 20) + 1;
        const operator = Math.random() < 0.5 ? '+' : '-';
        
        if (operator === '+' || num1 >= num2) {
            questionText = `${num1} ${operator} ${num2} = ?`;
            correctAnswer = operator === '+' ? num1 + num2 : num1 - num2;
        } else {
            // 引き算で答えがマイナスにならないように調整
            questionText = `${num2} - ${num1} = ?`;
            correctAnswer = num2 - num1;
        }
    }

    const options = new Set([correctAnswer]);
    const diffLimit = currentMode === 'multiplication' ? 30 : 5;

    while (options.size < 4) {
        const lowerLimit = currentMode === 'multiplication' ? 1 : 0;
        const wrongAnswer = Math.max(lowerLimit, correctAnswer + (Math.floor(Math.random() * (diffLimit * 2 + 1)) - diffLimit));
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
 * クイズの問題を画面に表示する
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
 * ゲームタイマーを更新する
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
 * タイマーの表示を更新する
 */
function updateTimerDisplay() {
    if (timeLeft >= 60) {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const secondsStr = seconds < 10 ? '0' + seconds : seconds;
        timerEl.textContent = `のこりじかん: ${minutes}ふん${secondsStr}びょう`;
    } else {
        timerEl.textContent = `のこりじかん: ${timeLeft}びょう`;
    }
}

/**
 * 回答が選択されたときの処理
 * @param {number} selectedOption - 選択された答え
 * @param {HTMLButtonElement} selectedButton - 選択されたボタン要素
 */
function handleAnswer(selectedOption, selectedButton) {
    const correctAnswer = currentQuestion.answer;

    // ボタンを一時的に無効化
    const optionButtons = optionsEl.querySelectorAll('.option');
    optionButtons.forEach(btn => btn.disabled = true);

    if (selectedOption === correctAnswer) {
        score++;
        scoreEl.textContent = score;
        selectedButton.classList.add('correct');
        // 0.5秒後に次の問題へ
        setTimeout(() => {
            displayQuestion();
        }, 500);
    } else {
        selectedButton.classList.add('incorrect');
        // 正解の選択肢をハイライト
        optionButtons.forEach(btn => {
            if (parseInt(btn.textContent) === correctAnswer) {
                btn.classList.add('correct');
            }
        });
        // 1.5秒後に次の問題へ
        setTimeout(() => {
            displayQuestion();
        }, 1500);
    }
}

/**
 * 最終結果を表示する
 */
function showResults() {
    quizContainerEl.classList.add('hidden');
    resultContainerEl.classList.remove('hidden');
    finalScoreEl.textContent = `${score}もん`;
}

/**
 * クイズを開始する
 * @param {string} mode - ゲームモード ('addition' または 'multiplication')
 */
function startQuiz(mode) {
    if (mode) {
        currentMode = mode;
    }
    score = 0;
    questionsAsked = 0;
    timeLeft = currentMode === 'multiplication' ? 180 : GAME_TIME_LIMIT;
    scoreEl.textContent = score;
    
    startContainer.classList.add('hidden');
    resultContainerEl.classList.add('hidden');
    quizContainerEl.classList.remove('hidden');
    
    updateTimerDisplay();
    displayQuestion();

    // 古いタイマーをクリアして新しいタイマーを開始
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
}


// --- イベントリスナー ---
modeAdditionButton.addEventListener('click', () => startQuiz('addition'));
modeMultiplicationButton.addEventListener('click', () => startQuiz('multiplication'));
restartButton.addEventListener('click', () => startQuiz(currentMode));
backToStartButton.addEventListener('click', showStartScreen);