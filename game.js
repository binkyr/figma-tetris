// Game constants
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 28;
const INITIAL_SPEED = 1000;

// Tetromino definitions
const TETROMINOES = {
    I: {
        shape: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ],
        color: '#00f0f0',
    },
    O: {
        shape: [
            [1, 1],
            [1, 1],
        ],
        color: '#f0f000',
    },
    T: {
        shape: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0],
        ],
        color: '#a000f0',
    },
    S: {
        shape: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0],
        ],
        color: '#00f000',
    },
    Z: {
        shape: [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0],
        ],
        color: '#f00000',
    },
    J: {
        shape: [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0],
        ],
        color: '#0000f0',
    },
    L: {
        shape: [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0],
        ],
        color: '#f0a000',
    },
};

// Game state
let gameState = {
    board: [],
    currentPiece: null,
    nextPiece: null,
    position: { x: 0, y: 0 },
    score: 0,
    lines: 0,
    level: 1,
    gameOver: false,
    isPaused: true,
    gameStarted: false,
    speed: INITIAL_SPEED,
    gameInterval: null,
};

// DOM elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nextPieceCanvas = document.getElementById('nextPieceCanvas');
const nextPieceCtx = nextPieceCanvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const gameOverCard = document.getElementById('gameOverCard');
const pausedCard = document.getElementById('pausedCard');

// Utility functions
function createEmptyBoard() {
    return Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null));
}

function getRandomTetromino() {
    const types = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    const type = types[Math.floor(Math.random() * types.length)];
    return {
        type,
        shape: TETROMINOES[type].shape.map(row => [...row]),
        color: TETROMINOES[type].color,
    };
}

function rotateTetromino(shape) {
    const rows = shape.length;
    const cols = shape[0].length;
    const rotated = [];

    for (let i = 0; i < cols; i++) {
        rotated[i] = [];
        for (let j = 0; j < rows; j++) {
            rotated[i][j] = shape[rows - 1 - j][i];
        }
    }

    return rotated;
}

function isValidMove(piece, pos) {
    return piece.shape.every((row, dy) =>
        row.every((cell, dx) => {
            if (!cell) return true;
            const newX = pos.x + dx;
            const newY = pos.y + dy;
            return (
                newX >= 0 &&
                newX < BOARD_WIDTH &&
                newY < BOARD_HEIGHT &&
                (newY < 0 || !gameState.board[newY][newX])
            );
        })
    );
}

function mergePieceToBoard() {
    if (!gameState.currentPiece) return;

    gameState.currentPiece.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell && gameState.position.y + y >= 0) {
                gameState.board[gameState.position.y + y][gameState.position.x + x] = 
                    gameState.currentPiece.color;
            }
        });
    });
}

function clearLines() {
    const newBoard = gameState.board.filter(row => row.some(cell => cell === null));
    const clearedLines = BOARD_HEIGHT - newBoard.length;

    if (clearedLines > 0) {
        const emptyRows = Array(clearedLines).fill(null).map(() => Array(BOARD_WIDTH).fill(null));
        gameState.board = [...emptyRows, ...newBoard];
        gameState.lines += clearedLines;

        // Update score
        const points = [0, 100, 300, 500, 800][clearedLines] * gameState.level;
        gameState.score += points;

        // Update level
        const newLevel = Math.floor(gameState.lines / 10) + 1;
        if (newLevel > gameState.level) {
            gameState.level = newLevel;
            gameState.speed = Math.max(100, INITIAL_SPEED - (newLevel - 1) * 100);
            resetGameInterval();
        }

        updateUI();
    }
}

function spawnNewPiece() {
    const piece = gameState.nextPiece || getRandomTetromino();
    gameState.nextPiece = getRandomTetromino();
    const startPos = {
        x: Math.floor(BOARD_WIDTH / 2) - Math.floor(piece.shape[0].length / 2),
        y: 0,
    };

    if (!isValidMove(piece, startPos)) {
        gameState.gameOver = true;
        gameState.isPaused = true;
        updateUI();
        updateButtons();
        clearInterval(gameState.gameInterval);
        return;
    }

    gameState.currentPiece = piece;
    gameState.position = startPos;
    drawNextPiece();
}

// Game actions
function moveDown() {
    if (!gameState.currentPiece || gameState.gameOver || gameState.isPaused) return;

    const newPos = { x: gameState.position.x, y: gameState.position.y + 1 };

    if (isValidMove(gameState.currentPiece, newPos)) {
        gameState.position = newPos;
    } else {
        mergePieceToBoard();
        clearLines();
        spawnNewPiece();
    }

    drawGame();
}

function moveLeft() {
    if (!gameState.currentPiece || gameState.gameOver || gameState.isPaused) return;
    const newPos = { x: gameState.position.x - 1, y: gameState.position.y };
    if (isValidMove(gameState.currentPiece, newPos)) {
        gameState.position = newPos;
        drawGame();
    }
}

function moveRight() {
    if (!gameState.currentPiece || gameState.gameOver || gameState.isPaused) return;
    const newPos = { x: gameState.position.x + 1, y: gameState.position.y };
    if (isValidMove(gameState.currentPiece, newPos)) {
        gameState.position = newPos;
        drawGame();
    }
}

function rotate() {
    if (!gameState.currentPiece || gameState.gameOver || gameState.isPaused) return;
    const rotatedShape = rotateTetromino(gameState.currentPiece.shape);
    const rotatedPiece = { ...gameState.currentPiece, shape: rotatedShape };

    if (isValidMove(rotatedPiece, gameState.position)) {
        gameState.currentPiece = rotatedPiece;
        drawGame();
    } else {
        // Try wall kicks
        const kicks = [
            { x: gameState.position.x + 1, y: gameState.position.y },
            { x: gameState.position.x - 1, y: gameState.position.y },
            { x: gameState.position.x + 2, y: gameState.position.y },
            { x: gameState.position.x - 2, y: gameState.position.y },
        ];

        for (const kick of kicks) {
            if (isValidMove(rotatedPiece, kick)) {
                gameState.currentPiece = rotatedPiece;
                gameState.position = kick;
                drawGame();
                break;
            }
        }
    }
}

function hardDrop() {
    if (!gameState.currentPiece || gameState.gameOver || gameState.isPaused) return;

    let newY = gameState.position.y;
    while (isValidMove(gameState.currentPiece, { x: gameState.position.x, y: newY + 1 })) {
        newY++;
    }

    gameState.score += (newY - gameState.position.y) * 2;
    gameState.position.y = newY;
    updateUI();
    drawGame();

    setTimeout(() => {
        mergePieceToBoard();
        clearLines();
        spawnNewPiece();
        drawGame();
    }, 50);
}

function togglePause() {
    if (!gameState.gameOver && gameState.gameStarted) {
        gameState.isPaused = !gameState.isPaused;
        updateButtons();
        updateUI();
        if (gameState.isPaused) {
            clearInterval(gameState.gameInterval);
        } else {
            resetGameInterval();
        }
    }
}

function startGame() {
    if (!gameState.gameStarted) {
        gameState.gameStarted = true;
        gameState.isPaused = false;
        spawnNewPiece();
        resetGameInterval();
    } else if (gameState.gameOver) {
        resetGame();
        gameState.gameStarted = true;
        gameState.isPaused = false;
        spawnNewPiece();
        resetGameInterval();
    }
    updateButtons();
    updateUI();
    drawGame();
}

function resetGame() {
    clearInterval(gameState.gameInterval);
    gameState.board = createEmptyBoard();
    gameState.currentPiece = null;
    gameState.nextPiece = null;
    gameState.position = { x: 0, y: 0 };
    gameState.score = 0;
    gameState.lines = 0;
    gameState.level = 1;
    gameState.speed = INITIAL_SPEED;
    gameState.gameOver = false;
    gameState.isPaused = true;
    gameState.gameStarted = false;
    updateUI();
    updateButtons();
    drawGame();
}

function resetGameInterval() {
    clearInterval(gameState.gameInterval);
    if (!gameState.isPaused && !gameState.gameOver && gameState.gameStarted) {
        gameState.gameInterval = setInterval(moveDown, gameState.speed);
    }
}

// Drawing functions
function drawCell(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    ctx.strokeStyle = '#1f2937';
    ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
}

function drawGame() {
    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw board
    gameState.board.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell) {
                drawCell(x, y, cell);
            } else {
                drawCell(x, y, '#1a1a1a');
            }
        });
    });

    // Draw current piece
    if (gameState.currentPiece) {
        gameState.currentPiece.shape.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell && gameState.position.y + y >= 0) {
                    drawCell(
                        gameState.position.x + x,
                        gameState.position.y + y,
                        gameState.currentPiece.color
                    );
                }
            });
        });
    }
}

function drawNextPiece() {
    nextPieceCtx.fillStyle = '#111827';
    nextPieceCtx.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);

    if (gameState.nextPiece) {
        const cellSize = 20;
        const offsetX = (nextPieceCanvas.width - gameState.nextPiece.shape[0].length * cellSize) / 2;
        const offsetY = (nextPieceCanvas.height - gameState.nextPiece.shape.length * cellSize) / 2;

        gameState.nextPiece.shape.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell) {
                    nextPieceCtx.fillStyle = gameState.nextPiece.color;
                    nextPieceCtx.fillRect(
                        offsetX + x * cellSize,
                        offsetY + y * cellSize,
                        cellSize,
                        cellSize
                    );
                }
            });
        });
    }
}

function updateUI() {
    scoreEl.textContent = gameState.score;
    linesEl.textContent = gameState.lines;
    levelEl.textContent = gameState.level;
    
    gameOverCard.style.display = gameState.gameOver ? 'block' : 'none';
    pausedCard.style.display = (gameState.isPaused && !gameState.gameOver && gameState.gameStarted) ? 'block' : 'none';
}

function updateButtons() {
    if (!gameState.gameStarted || gameState.gameOver) {
        startBtn.style.display = 'inline-flex';
        pauseBtn.style.display = 'none';
        restartBtn.style.display = 'none';
        
        if (gameState.gameOver) {
            startBtn.innerHTML = `
                <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                Restart
            `;
        } else {
            startBtn.innerHTML = `
                <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                Start Game
            `;
        }
    } else {
        startBtn.style.display = 'none';
        pauseBtn.style.display = 'inline-flex';
        restartBtn.style.display = 'inline-flex';
        
        if (gameState.isPaused) {
            pauseBtn.innerHTML = `
                <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                Resume
            `;
        } else {
            pauseBtn.innerHTML = `
                <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
                Pause
            `;
        }
    }
}

// Event listeners
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);
restartBtn.addEventListener('click', () => {
    resetGame();
    startGame();
});

document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            moveLeft();
            break;
        case 'ArrowRight':
            e.preventDefault();
            moveRight();
            break;
        case 'ArrowDown':
            e.preventDefault();
            moveDown();
            break;
        case 'ArrowUp':
            e.preventDefault();
            rotate();
            break;
        case ' ':
            e.preventDefault();
            hardDrop();
            break;
        case 'p':
        case 'P':
            e.preventDefault();
            togglePause();
            break;
        case 'r':
        case 'R':
            e.preventDefault();
            if (gameState.gameOver) {
                resetGame();
                startGame();
            }
            break;
    }
});

// Initialize game
gameState.board = createEmptyBoard();
drawGame();
updateUI();
updateButtons();