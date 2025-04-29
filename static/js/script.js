let currentBoard = [];
let visualizing = false;

function renderBoard(board, highlight = null) {
    currentBoard = board.map(row => row.slice());
    const boardDiv = document.getElementById('sudoku-board');
    boardDiv.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'sudoku-row';
        for (let j = 0; j < 9; j++) {
            const cellDiv = document.createElement('div');
            cellDiv.className = 'sudoku-cell';

            // Borders for sudoku grid
            let style = '';
            // Outer borders
            if (i === 0) style += 'border-top:3px solid var(--cell-border-strong);';
            if (j === 0) style += 'border-left:3px solid var(--cell-border-strong);';
            if (i === 8) style += 'border-bottom:3px solid var(--cell-border-strong);';
            if (j === 8) style += 'border-right:3px solid var(--cell-border-strong);';
            // Box borders
            if (i % 3 === 2 && i !== 8) style += 'border-bottom:3px solid var(--cell-border-strong);';
            if (j % 3 === 2 && j !== 8) style += 'border-right:3px solid var(--cell-border-strong);';
            cellDiv.style = style;

            // Highlighting for current step
            if (highlight && highlight.row === i && highlight.col === j) {
                cellDiv.classList.add(
                    highlight.action === 'try' ? 'highlight-try' : 'highlight-backtrack'
                );
            }

            // Display number or empty
            cellDiv.textContent = board[i][j] !== 0 ? board[i][j] : '';
            rowDiv.appendChild(cellDiv);
        }
        boardDiv.appendChild(rowDiv);
    }
}

function generateBoard() {
    if (visualizing) return;
    const difficulty = document.getElementById('difficulty').value;
    fetch('/generate', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({difficulty})
    })
    .then(response => response.json())
    .then(data => {
        renderBoard(data.board);
        document.getElementById('visual-status').textContent = '';
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function visualSolveBoard() {
    if (visualizing) return;
    visualizing = true;
    document.getElementById('visual-status').textContent = 'Visualizing...';
    fetch('/solve-visual', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({board: currentBoard})
    })
    .then(response => response.json())
    .then(async data => {
        let tempBoard = currentBoard.map(row => row.slice());
        for (let step of data.steps) {
            const {row, col, num, action} = step;
            if (action === 'try') {
                tempBoard[row][col] = num;
            } else if (action === 'backtrack') {
                tempBoard[row][col] = 0;
            }
            renderBoard(tempBoard, {row, col, action});
            let speed = parseInt(document.getElementById('speed').value);
            await sleep(speed);
        }
        renderBoard(tempBoard);
        document.getElementById('visual-status').textContent = 'Visualization complete!';
        visualizing = false;
    });
}

// Speed slider
document.getElementById('speed').oninput = function() {
    document.getElementById('speedValue').textContent = this.value + "ms";
};

// Initialize board when page loads
document.addEventListener('DOMContentLoaded', function() {
    generateBoard();
    
    // Attach event listeners to buttons
    document.querySelector('button:nth-of-type(1)').addEventListener('click', generateBoard);
    document.querySelector('button:nth-of-type(2)').addEventListener('click', visualSolveBoard);
});
