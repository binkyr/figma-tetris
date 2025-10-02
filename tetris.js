// Game constants
const COLS = 12;
const ROWS = 20;
const BLOCK_SIZE = 20;

// Tetromino shapes
const SHAPES = {
    I: [[1, 1, 1, 1]],
    O: [[1, 1], [1, 1]],
    T: [[0, 1, 0], [1, 1, 1]],
    S: [[0, 1, 1], [1, 1, 0]],
    Z: [[1, 1, 0], [0, 1, 1]],
    L: [[1, 0], [1, 0], [1, 1]],
    J: [[0, 1], [0, 1], [1, 1]]
};

// Colors for each shape
const COLORS = {
    I: '#00f0f0',
    O: '#f0f000',
    T: '#a000f0',
    S: '#00f000',
    Z: '#f00000',
    L: '#f0a000',
    J: '#0000f0'
};

// Game state
let canvas, ctx;
let board = [];
let currentPiece = null;
let gameRunning = false;
let gamePaused = false;
let gameLoop = null;
let score = 0;
let level = 1;
let lines = 0;
let dropInterval = 1000;
let lastDropTime = 0;

// Initialize game
function init() {
    canvas = document.getElementById('tetris');
    ctx = canvas.getContext('2d');
    
    // Initialize board
    for (let row = 0; row < ROWS; row++) {
        board[row] = [];
        for (let col = 0; col < COLS; col++) {
            board[row][col] = 0;
        }
    }
    
    // Event listeners
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    document.addEventListener('keydown', handleKeyPress);
    
    drawBoard();
}

// Start game
function startGame() {
    if (gameRunning) return;
    
    // Reset game state
    board = [];
    for (let row = 0; row < ROWS; row++) {
        board[row] = [];
        for (let col = 0; col < COLS; col++) {
            board[row][col] = 0;
        }
    }
    
    score = 0;
    level = 1;
    lines = 0;
    dropInterval = 1000;
    updateScore();
    
    gameRunning = true;
    gamePaused = false;
    document.getElementById('startBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
    
    spawnPiece();
    lastDropTime = Date.now();
    gameLoop = requestAnimationFrame(update);
}

// Toggle pause
function togglePause() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    document.getElementById('pauseBtn').textContent = gamePaused ? 'Resume' : 'Pause';
    
    if (!gamePaused) {
        lastDropTime = Date.now();
        gameLoop = requestAnimationFrame(update);
    }
}

// Spawn new piece
function spawnPiece() {
    const shapes = Object.keys(SHAPES);
    const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
    
    currentPiece = {
        shape: SHAPES[randomShape],
        color: COLORS[randomShape],
        x: Math.floor(COLS / 2) - Math.floor(SHAPES[randomShape][0].length / 2),
        y: 0
    };
    
    // Check if game over
    if (collision(currentPiece.x, currentPiece.y, currentPiece.shape)) {
        gameOver();
    }
}

// Check collision
function collision(x, y, shape) {
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const newX = x + col;
                const newY = y + row;
                
                if (newX < 0 || newX >= COLS || newY >= ROWS) {
                    return true;
                }
                
                if (newY >= 0 && board[newY][newX]) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Merge piece to board
function mergePiece() {
    for (let row = 0; row < currentPiece.shape.length; row++) {
        for (let col = 0; col < currentPiece.shape[row].length; col++) {
            if (currentPiece.shape[row][col]) {
                const boardY = currentPiece.y + row;
                const boardX = currentPiece.x + col;
                if (boardY >= 0) {
                    board[boardY][boardX] = currentPiece.color;
                }
            }
        }
    }
}

// Clear completed lines
function clearLines() {
    let linesCleared = 0;
    
    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row].every(cell => cell !== 0)) {
            board.splice(row, 1);
            board.unshift(new Array(COLS).fill(0));
            linesCleared++;
            row++; // Check the same row again
        }
    }
    
    if (linesCleared > 0) {
        lines += linesCleared;
        score += linesCleared * 100 * level;
        
        // Level up every 10 lines
        if (lines >= level * 10) {
            level++;
            dropInterval = Math.max(100, 1000 - (level - 1) * 100);
        }
        
        updateScore();
    }
}

// Update score display
function updateScore() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('lines').textContent = lines;
}

// Rotate piece
function rotate() {
    const rotated = currentPiece.shape[0].map((_, i) =>
        currentPiece.shape.map(row => row[i]).reverse()
    );
    
    if (!collision(currentPiece.x, currentPiece.y, rotated)) {
        currentPiece.shape = rotated;
    }
}

// Move piece
function move(dir) {
    const newX = currentPiece.x + dir;
    if (!collision(newX, currentPiece.y, currentPiece.shape)) {
        currentPiece.x = newX;
    }
}

// Drop piece one row
function drop() {
    const newY = currentPiece.y + 1;
    if (!collision(currentPiece.x, newY, currentPiece.shape)) {
        currentPiece.y = newY;
        return true;
    } else {
        mergePiece();
        clearLines();
        spawnPiece();
        return false;
    }
}

// Hard drop
function hardDrop() {
    while (drop()) {
        score += 2;
    }
    updateScore();
}

// Handle keyboard input
function handleKeyPress(e) {
    if (!gameRunning || gamePaused) return;
    
    switch(e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            move(-1);
            break;
        case 'ArrowRight':
            e.preventDefault();
            move(1);
            break;
        case 'ArrowUp':
            e.preventDefault();
            rotate();
            break;
        case 'ArrowDown':
            e.preventDefault();
            drop();
            break;
        case ' ':
            e.preventDefault();
            hardDrop();
            break;
    }
    
    drawBoard();
}

// Game loop
function update(time) {
    if (!gameRunning || gamePaused) return;
    
    const deltaTime = time - lastDropTime;
    
    if (deltaTime > dropInterval) {
        drop();
        lastDropTime = time;
    }
    
    drawBoard();
    gameLoop = requestAnimationFrame(update);
}

// Draw board
function drawBoard() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw board
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col]) {
                ctx.fillStyle = board[row][col];
                ctx.fillRect(col * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
            }
        }
    }
    
    // Draw current piece
    if (currentPiece) {
        ctx.fillStyle = currentPiece.color;
        for (let row = 0; row < currentPiece.shape.length; row++) {
            for (let col = 0; col < currentPiece.shape[row].length; col++) {
                if (currentPiece.shape[row][col]) {
                    ctx.fillRect(
                        (currentPiece.x + col) * BLOCK_SIZE,
                        (currentPiece.y + row) * BLOCK_SIZE,
                        BLOCK_SIZE - 1,
                        BLOCK_SIZE - 1
                    );
                }
            }
        }
    }
    
    // Draw grid
    ctx.strokeStyle = '#333';
    for (let row = 0; row <= ROWS; row++) {
        ctx.beginPath();
        ctx.moveTo(0, row * BLOCK_SIZE);
        ctx.lineTo(COLS * BLOCK_SIZE, row * BLOCK_SIZE);
        ctx.stroke();
    }
    for (let col = 0; col <= COLS; col++) {
        ctx.beginPath();
        ctx.moveTo(col * BLOCK_SIZE, 0);
        ctx.lineTo(col * BLOCK_SIZE, ROWS * BLOCK_SIZE);
        ctx.stroke();
    }
}

// Game over
function gameOver() {
    gameRunning = false;
    gamePaused = false;
    cancelAnimationFrame(gameLoop);
    
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('pauseBtn').textContent = 'Pause';
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '16px Arial';
    ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText('Click Start to play again', canvas.width / 2, canvas.height / 2 + 40);
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', init);
