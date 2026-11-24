// ==========================================================================
// Практична 2.1: Дублювання карток
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const cardContainer = document.querySelector('.card-container');
    const firstCard = cardContainer ? cardContainer.querySelector('.card') : null;

    if (cardContainer && firstCard) {
        const totalCards = 10;

        for (let i = 1; i < totalCards; i++) {
            const clonedCard = firstCard.cloneNode(true);
            cardContainer.appendChild(clonedCard);
        }
    }
});

// ==========================================================================
// Практична робота: Обробка подій у JavaScript (М'яч)
// ==========================================================================

// 1. Отримання доступу до елемента м'яча через getElementsByClassName
const ball = document.getElementsByClassName('ball')[0];
const ballField = document.getElementById('ball-field');
const ballTarget = document.getElementById('ball-target');
const ballStatusEl = document.getElementById('ball-status');
const ballCoordsEl = document.getElementById('ball-coords');
const ballAngleEl = document.getElementById('ball-angle');
const ballResetBtn = document.getElementById('ball-reset');

// Початковий стан м'яча та параметри гри
const INITIAL_POSITION = { left: 40, top: 40 };
const ROTATION_STEP = 45;
const TARGET_ANGLE = 180;
const DRAG_THRESHOLD = 5;

const ballPosition = {
    left: INITIAL_POSITION.left,
    top: INITIAL_POSITION.top
};

let ballRotation = 0;

// Стан перетягування мишею (Drag'n'Drop)
let isPointerDown = false;
let hasDragged = false;
let suppressNextClick = false;
let dragStartPointerX = 0;
let dragStartPointerY = 0;
let dragStartBallLeft = 0;
let dragStartBallTop = 0;

/**
 * Повертає нормалізований кут у діапазоні [0, 360).
 */
function getNormalizedAngle(angle) {
    return ((angle % 360) + 360) % 360;
}

/**
 * Обмежує координати м'яча межами ігрового поля.
 */
function clampBallPosition() {
    if (!ball || !ballField) return;
    const maxLeft = Math.max(0, ballField.clientWidth - ball.offsetWidth);
    const maxTop = Math.max(0, ballField.clientHeight - ball.offsetHeight);

    ballPosition.left = Math.min(Math.max(0, Math.round(ballPosition.left)), maxLeft);
    ballPosition.top = Math.min(Math.max(0, Math.round(ballPosition.top)), maxTop);
}

/**
 * Застосовує поточні координати ballPosition до стилів м'яча.
 */
function applyBallPosition() {
    if (!ball) return;
    ball.style.left = `${ballPosition.left}px`;
    ball.style.top = `${ballPosition.top}px`;
}

/**
 * Оновлює панель показників (координати та кут).
 */
function updateBallHud() {
    const normalizedAngle = getNormalizedAngle(ballRotation);

    if (ballCoordsEl) {
        ballCoordsEl.textContent = `Позиція: X: ${ballPosition.left}px, Y: ${ballPosition.top}px`;
    }
    if (ballAngleEl) {
        ballAngleEl.textContent = `Кут: ${normalizedAngle}° (ціль: ${TARGET_ANGLE}°)`;
    }
}

/**
 * Перевіряє, чи потрапив центр м'яча в область цілі (без вимоги піксельної точності).
 */
function isBallInTargetArea() {
    if (!ball || !ballTarget) return false;

    const ballCenterX = ballPosition.left + ball.offsetWidth / 2;
    const ballCenterY = ballPosition.top + ball.offsetHeight / 2;
    const targetCenterX = ballTarget.offsetLeft + ballTarget.offsetWidth / 2;
    const targetCenterY = ballTarget.offsetTop + ballTarget.offsetHeight / 2;

    const distance = Math.hypot(ballCenterX - targetCenterX, ballCenterY - targetCenterY);
    const hitRadius = (ballTarget.offsetWidth - ball.offsetWidth) / 2 + 8;

    return distance <= hitRadius;
}

/**
 * Перевіряє умову перемоги з урахуванням як координат цілі, так і кута повороту (180°).
 */
function checkWinCondition() {
    if (!ball || !ballTarget || !ballStatusEl) return;

    const inTarget = isBallInTargetArea();
    const normalizedAngle = getNormalizedAngle(ballRotation);
    const isAngleMatched = normalizedAngle === TARGET_ANGLE;

    ballTarget.classList.remove('ball-target--almost', 'ball-target--won');
    ballStatusEl.classList.remove('ball-status--warning', 'ball-status--success');
    ball.classList.remove('ball--won');

    if (inTarget && isAngleMatched) {
        ballTarget.classList.add('ball-target--won');
        ballStatusEl.classList.add('ball-status--success');
        ball.classList.add('ball--won');
        ballStatusEl.textContent = `Перемога! М'яч у цілі та повернутий на ${TARGET_ANGLE}°!`;
    } else if (inTarget && !isAngleMatched) {
        ballTarget.classList.add('ball-target--almost');
        ballStatusEl.classList.add('ball-status--warning');
        ballStatusEl.textContent = `Координати збігаються, але поточний кут ${normalizedAngle}° замість ${TARGET_ANGLE}°. Поверніть м'яч кліком або Пробілом!`;
    } else {
        ballStatusEl.textContent = `Доставте м'яч у ціль та поверніть його на ${TARGET_ANGLE}° (стрілкою вниз).`;
    }
}

/**
 * 2. Обробник події keydown на м'ячі:
 *    - Стрілки переміщують м'яч (100px / Shift: 10px / Ctrl: 1px)
 *    - Пробіл обертає м'яч
 */
function ballKeydownListener(event) {
    console.log('Keydown on ball:', {
        key: event.key,
        code: event.code,
        shiftKey: event.shiftKey,
        ctrlKey: event.ctrlKey
    });

    // Обертання м'яча при натисканні Пробілу
    if (event.key === ' ' || event.code === 'Space') {
        event.preventDefault();
        rotateBall();
        return;
    }

    // Визначення напрямку руху
    let direction;
    switch (event.key) {
        case 'ArrowLeft':
            direction = 'left';
            break;
        case 'ArrowRight':
            direction = 'right';
            break;
        case 'ArrowUp':
            direction = 'up';
            break;
        case 'ArrowDown':
            direction = 'down';
            break;
        default:
            return;
    }

    // Визначення кроку руху залежно від модифікаторів
    let step = 100;
    if (event.ctrlKey) {
        step = 1;
    } else if (event.shiftKey) {
        step = 10;
    }

    event.preventDefault();
    moveBall(direction, step);
}

/**
 * 3. Переміщення м'яча у заданому напрямку на задану кількість пікселів.
 */
function moveBall(direction, step) {
    switch (direction) {
        case 'left':
            ballPosition.left -= step;
            break;
        case 'right':
            ballPosition.left += step;
            break;
        case 'up':
            ballPosition.top -= step;
            break;
        case 'down':
            ballPosition.top += step;
            break;
        default:
            return;
    }

    clampBallPosition();
    applyBallPosition();
    updateBallHud();
    checkWinCondition();
}

/**
 * 4. Обертання м'яча через CSS transform: rotate(...).
 */
function rotateBall(event) {
    // Не обертаємо м'яч, якщо подія click виникла одразу після завершення Drag'n'Drop
    if (event && event.type === 'click' && suppressNextClick) {
        suppressNextClick = false;
        return;
    }

    ballRotation += ROTATION_STEP;
    ball.style.transform = `rotate(${ballRotation}deg)`;

    updateBallHud();
    checkWinCondition();
}

/**
 * Скидання м'яча у початкове положення.
 */
function resetBallGame() {
    ballPosition.left = INITIAL_POSITION.left;
    ballPosition.top = INITIAL_POSITION.top;
    ballRotation = 0;

    if (ball) {
        ball.style.transform = 'rotate(0deg)';
    }

    clampBallPosition();
    applyBallPosition();
    updateBallHud();
    checkWinCondition();
}

// Ініціалізація обробників подій для м'яча
if (ball) {
    // Гарантуємо можливість отримання фокусу через Tab
    if (!ball.hasAttribute('tabindex')) {
        ball.setAttribute('tabindex', '0');
    }

    // Початкове відображення
    applyBallPosition();
    updateBallHud();
    checkWinCondition();

    // Обробка клавіатури (стрілки + модифікатори + Пробіл)
    ball.addEventListener('keydown', ballKeydownListener);

    // Обробка кліку для обертання м'яча
    ball.addEventListener('click', rotateBall);

    // Перетягування м'яча мишею (Drag'n'Drop: mousedown / mousemove / mouseup)
    ball.addEventListener('mousedown', (event) => {
        if (event.button !== 0) return;

        isPointerDown = true;
        hasDragged = false;
        dragStartPointerX = event.clientX;
        dragStartPointerY = event.clientY;
        dragStartBallLeft = ballPosition.left;
        dragStartBallTop = ballPosition.top;

        ball.focus();
    });

    document.addEventListener('mousemove', (event) => {
        if (!isPointerDown) return;

        const dx = event.clientX - dragStartPointerX;
        const dy = event.clientY - dragStartPointerY;

        if (!hasDragged && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
            hasDragged = true;
            ball.classList.add('ball--dragging');
        }

        if (hasDragged) {
            ballPosition.left = dragStartBallLeft + dx;
            ballPosition.top = dragStartBallTop + dy;

            clampBallPosition();
            applyBallPosition();
            updateBallHud();
        }
    });

    document.addEventListener('mouseup', () => {
        if (!isPointerDown) return;

        isPointerDown = false;

        if (hasDragged) {
            hasDragged = false;
            ball.classList.remove('ball--dragging');

            // Блокуємо синтетичний click одразу після відпускання миші
            suppressNextClick = true;
            setTimeout(() => {
                suppressNextClick = false;
            }, 0);

            checkWinCondition();
        }
    });

    // Кнопка скидання гри
    if (ballResetBtn) {
        ballResetBtn.addEventListener('click', () => {
            resetBallGame();
            ball.focus();
        });
    }

    // Коригування позиції при зміні розміру вікна
    window.addEventListener('resize', () => {
        clampBallPosition();
        applyBallPosition();
        updateBallHud();
        checkWinCondition();
    });
}
