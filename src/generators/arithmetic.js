import { gcd, lcm } from './rng.js';
import { generateUnitsQuestion, generateUnitsLow, generateUnitsMid, generateUnitsHigh } from './units.js';

/**
 * たしざん・ひきざんの問題を生成
 */
export function generateAdditionQuestion(r) {
    const num1 = r.int(1, 20);
    const num2 = r.int(1, 20);
    const operator = r.bool() ? '+' : '-';
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
        const wrong = Math.max(0, correctAnswer + r.int(-5, 5));
        if (wrong !== correctAnswer) {
            options.add(wrong);
        }
    }

    return {
        question: questionText,
        options: r.shuffle(Array.from(options)),
        answer: correctAnswer
    };
}

/**
 * かけざんの問題を生成（questionsAsked が増えるほど2桁が増える）
 */
export function generateMultiplicationQuestion(r, questionsAsked = 1) {
    let num1, num2, type;
    const rand = r.next();

    if (questionsAsked <= 5) {
        type = rand < 0.50 ? '1x1' : (rand < 0.90 ? '1x2' : '2x2');
    } else if (questionsAsked <= 12) {
        type = rand < 0.20 ? '1x1' : (rand < 0.70 ? '1x2' : '2x2');
    } else if (questionsAsked <= 20) {
        type = rand < 0.10 ? '1x1' : (rand < 0.50 ? '1x2' : '2x2');
    } else {
        type = rand < 0.20 ? '1x2' : '2x2';
    }

    const getSingleDigit = () => r.int(1, 9);
    const getDoubleDigit = () => r.int(10, 20);

    if (type === '1x1') {
        num1 = getSingleDigit();
        num2 = getSingleDigit();
    } else if (type === '1x2') {
        if (r.bool()) {
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
        const wrongAnswer = correctAnswer + r.pick(steps);
        if (wrongAnswer > 0 && wrongAnswer !== correctAnswer) {
            options.add(wrongAnswer);
        }
    }

    while (options.size < 4) {
        const wrongAnswer = Math.max(1, correctAnswer + r.int(-30, 30));
        if (wrongAnswer !== correctAnswer) {
            options.add(wrongAnswer);
        }
    }

    return {
        question: questionText,
        options: r.shuffle(Array.from(options)),
        answer: correctAnswer
    };
}

/**
 * わりざんの問題を生成（割り切れ・あまりあり）
 */
export function generateDivisionQuestion(r) {
    const isRemainder = r.bool(0.35); // 35%あまりあり問題
    let questionText, correctAnswer;

    if (!isRemainder) {
        // 割り切れる問題
        const divisor = r.int(2, 10);
        const quotient = r.int(1, 9);
        const dividend = divisor * quotient;

        questionText = `${dividend} ÷ ${divisor} = ?`;
        correctAnswer = quotient;

        const options = new Set([correctAnswer]);
        while (options.size < 4) {
            const wrong = Math.max(1, correctAnswer + r.int(-4, 4));
            if (wrong !== correctAnswer) {
                options.add(wrong);
            }
        }

        return {
            question: questionText,
            options: r.shuffle(Array.from(options)),
            answer: correctAnswer
        };
    } else {
        // あまりのある問題
        const divisor = r.int(2, 9);
        const quotient = r.int(1, 8);
        const remainder = r.int(1, divisor - 1);
        const dividend = divisor * quotient + remainder;

        questionText = `${dividend} ÷ ${divisor} = ?`;
        correctAnswer = `${quotient} あまり ${remainder}`;

        const options = new Set([correctAnswer]);
        // 誤答生成（商違い・あまり違い）
        options.add(`${quotient} あまり ${Math.max(0, remainder - 1 || 1)}`);
        options.add(`${Math.max(1, quotient + 1)} あまり ${remainder}`);
        options.add(`${Math.max(1, quotient - 1)} あまり ${remainder}`);

        while (options.size < 4) {
            // 上側を広めにとる（3 ÷ 2 のように商もあまりも1のとき、±2では誤答が足りず終わらなくなる）
            const wQ = Math.max(1, quotient + r.int(-2, 3));
            const wR = r.int(1, divisor - 1);
            const wrongStr = `${wQ} あまり ${wR}`;
            if (wrongStr !== correctAnswer) {
                options.add(wrongStr);
            }
        }

        return {
            question: questionText,
            options: r.shuffle(Array.from(options)),
            answer: correctAnswer
        };
    }
}

/**
 * しょうすうの問題を生成
 */
export function generateDecimalsQuestion(r) {
    const op = r.pick(['+', '-', '×']);
    let num1, num2, questionText, correctAnswer;

    if (op === '+') {
        num1 = r.int(10, 98) / 10; // 1.0〜9.8
        num2 = r.int(10, 98) / 10;
        correctAnswer = Math.round((num1 + num2) * 10) / 10;
        questionText = `${num1} + ${num2} = ?`;
    } else if (op === '-') {
        const a = r.int(10, 98) / 10;
        const b = r.int(10, 98) / 10;
        num1 = Math.max(a, b);
        num2 = Math.min(a, b);
        correctAnswer = Math.round((num1 - num2) * 10) / 10;
        questionText = `${num1} - ${num2} = ?`;
    } else {
        // かけ算 (0.X × Y)
        num1 = r.int(1, 9) / 10; // 0.1〜0.9
        num2 = r.int(2, 10);
        correctAnswer = Math.round((num1 * num2) * 10) / 10;
        questionText = `${num1} × ${num2} = ?`;
    }

    const options = new Set([correctAnswer]);
    const diffs = [-0.2, -0.1, 0.1, 0.2, 0.5, -0.5, 1.0];
    while (options.size < 4) {
        const wrong = Math.round((correctAnswer + r.pick(diffs)) * 10) / 10;
        if (wrong > 0 && wrong !== correctAnswer) {
            options.add(wrong);
        }
    }

    return {
        question: questionText,
        options: r.shuffle(Array.from(options)),
        answer: correctAnswer
    };
}

/**
 * ぶんすうの問題を生成（同分母・異分母の通分足し算・引き算）
 */
export function generateFractionsQuestion(r) {
    const isDifferentDenominator = r.bool(); // 50% 異分母問題

    if (!isDifferentDenominator) {
        // 同分母の問題
        const denominator = r.int(3, 9);
        const op = r.bool() ? '+' : '-';
        let num1, num2, resultNum, questionText;

        if (op === '+') {
            num1 = r.int(1, denominator - 2);
            num2 = r.int(1, denominator - num1 - 1);
            resultNum = num1 + num2;
            questionText = `${num1}/${denominator} + ${num2}/${denominator} = ?`;
        } else {
            num1 = r.int(2, denominator - 1);
            num2 = r.int(1, num1 - 1);
            resultNum = num1 - num2;
            questionText = `${num1}/${denominator} - ${num2}/${denominator} = ?`;
        }

        const correctAnswer = `${resultNum}/${denominator}`;
        const options = new Set([correctAnswer]);

        // 誤答の生成（分子だけ変える、または分母も足してしまう定番ミス）
        if (op === '+') {
            options.add(`${resultNum}/${denominator + denominator}`); // 分母も足してしまうミス
        }

        while (options.size < 4) {
            // 上側を広めにとる（答えの分子が1のとき、±2では誤答が2つしか作れず終わらなくなる）
            const wrongResultNum = Math.max(1, resultNum + r.int(-2, 3));
            const wrongOption = `${wrongResultNum}/${denominator}`;
            if (wrongOption !== correctAnswer) {
                options.add(wrongOption);
            }
        }

        return {
            question: questionText,
            options: r.shuffle(Array.from(options)),
            answer: correctAnswer
        };
    } else {
        // 異分母の問題（通分が必要）
        const denomPairs = [
            [2, 3], [2, 4], [2, 5], [3, 4], [3, 6], [4, 6], [4, 8], [3, 5], [2, 6]
        ];
        let [d1, d2] = r.pick(denomPairs);
        if (r.bool()) {
            [d1, d2] = [d2, d1];
        }

        const n1 = r.int(1, d1 - 1);
        const n2 = r.int(1, d2 - 1);
        const op = r.bool() ? '+' : '-';

        let finalN, questionText;

        const commonD = lcm(d1, d2);
        const scaledN1 = n1 * (commonD / d1);
        const scaledN2 = n2 * (commonD / d2);

        if (op === '+') {
            finalN = scaledN1 + scaledN2;
            questionText = `${n1}/${d1} + ${n2}/${d2} = ?`;
        } else if (scaledN1 === scaledN2) {
            // 差が0になる組は出題しない（引き直す）
            return generateFractionsQuestion(r);
        } else if (scaledN1 > scaledN2) {
            finalN = scaledN1 - scaledN2;
            questionText = `${n1}/${d1} - ${n2}/${d2} = ?`;
        } else {
            finalN = scaledN2 - scaledN1;
            questionText = `${n2}/${d2} - ${n1}/${d1} = ?`;
        }
        const finalD = commonD;

        const g = gcd(finalN, finalD);
        const ansN = finalN / g;
        const ansD = finalD / g;

        const correctAnswer = ansD === 1 ? `${ansN}` : `${ansN}/${ansD}`;
        const options = new Set([correctAnswer]);
        const addWrong = (opt) => {
            if (options.size < 4) {
                options.add(opt);
            }
        };

        // 定番ミス1: 通分せずに分子と分母をそれぞれ足す/引く
        const wrongDirectN = op === '+' ? n1 + n2 : Math.abs(n1 - n2) || 1;
        const wrongDirectD = d1 + d2;
        addWrong(`${wrongDirectN}/${wrongDirectD}`);

        // 定番ミス2: 分子の計算ミス
        const wrongScaleN = Math.max(1, ansN + 1);
        addWrong(ansD === 1 ? `${wrongScaleN}` : `${wrongScaleN}/${ansD}`);

        const wrongScaleN2 = Math.max(1, ansN - 1);
        if (wrongScaleN2 !== ansN) {
            addWrong(ansD === 1 ? `${wrongScaleN2}` : `${wrongScaleN2}/${ansD}`);
        }

        while (options.size < 4) {
            const rN = Math.max(1, ansN + r.int(-2, 2));
            const rD = ansD === 1 ? 1 : Math.max(2, ansD + r.int(-1, 1));
            const optStr = rD === 1 ? `${rN}` : `${rN}/${rD}`;
            if (optStr !== correctAnswer) {
                options.add(optStr);
            }
        }

        return {
            question: questionText,
            options: r.shuffle(Array.from(options)),
            answer: correctAnswer
        };
    }
}

const GENERATORS = {
    addition: generateAdditionQuestion,
    multiplication: generateMultiplicationQuestion,
    division: generateDivisionQuestion,
    decimals: generateDecimalsQuestion,
    fractions: generateFractionsQuestion,
    'units-low': generateUnitsLow,
    'units-mid': generateUnitsMid,
    'units-high': generateUnitsHigh,
    // ミックス用。単位は学年帯をランダムにえらぶ
    units: r => generateUnitsQuestion(r.pick(['low', 'mid', 'high']), r),
};

// ミックスで出す種類（単位は学年帯ごとの3つではなく、まとめて1つと数える）
const MIXED_KINDS = ['addition', 'multiplication', 'division', 'decimals', 'fractions', 'units'];

/**
 * 計算モード1回分の出題関数を作る。'mixed' は6種からランダムに出す
 */
export function createCalcGenerator(mode, r) {
    let questionsAsked = 0;
    return () => {
        questionsAsked++;
        const kind = mode === 'mixed' ? r.pick(MIXED_KINDS) : mode;
        return (GENERATORS[kind] || generateAdditionQuestion)(r, questionsAsked);
    };
}
