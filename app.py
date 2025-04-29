from flask import Flask, render_template, request, jsonify
import random
import copy

app = Flask(__name__)

class Sudoku:
    def __init__(self, board=None):
        self.board = board if board else [[0 for _ in range(9)] for _ in range(9)]

    def find_empty(self):
        for i in range(9):
            for j in range(9):
                if self.board[i][j] == 0:
                    return (i, j)
        return None

    def valid(self, num, pos):
        row, col = pos
        for j in range(9):
            if self.board[row][j] == num and j != col:
                return False
        for i in range(9):
            if self.board[i][col] == num and i != row:
                return False
        box_x = col // 3
        box_y = row // 3
        for i in range(box_y*3, box_y*3+3):
            for j in range(box_x*3, box_x*3+3):
                if self.board[i][j] == num and (i, j) != pos:
                    return False
        return True

    def solve(self):
        find = self.find_empty()
        if not find:
            return True
        row, col = find
        for num in range(1, 10):
            if self.valid(num, (row, col)):
                self.board[row][col] = num
                if self.solve():
                    return True
                self.board[row][col] = 0
        return False

    def generate(self, attempts=30):
        self.solve()
        count = attempts
        while count > 0:
            row = random.randint(0, 8)
            col = random.randint(0, 8)
            while self.board[row][col] == 0:
                row = random.randint(0, 8)
                col = random.randint(0, 8)
            backup = self.board[row][col]
            self.board[row][col] = 0
            board_copy = copy.deepcopy(self.board)
            solver = Sudoku(board_copy)
            if not solver.solve():
                self.board[row][col] = backup
            count -= 1

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate', methods=['POST'])
def generate():
    difficulty = request.json.get('difficulty', 'easy')
    attempts = {'easy': 20, 'medium': 35, 'hard': 50}.get(difficulty, 20)
    sudoku = Sudoku()
    sudoku.generate(attempts)
    return jsonify({'board': sudoku.board})

    
@app.route('/solve-visual', methods=['POST'])
def solve_visual():
    board = request.json.get('board')
    steps = []
    sudoku = Sudoku([row[:] for row in board])
    def visual_solve():
        find = sudoku.find_empty()
        if not find:
            return True
        row, col = find
        for num in range(1, 10):
            steps.append({'row': row, 'col': col, 'num': num, 'action': 'try'})
            if sudoku.valid(num, (row, col)):
                sudoku.board[row][col] = num
                if visual_solve():
                    return True
                sudoku.board[row][col] = 0
            steps.append({'row': row, 'col': col, 'num': num, 'action': 'backtrack'})
        return False
    visual_solve()
    return jsonify({'steps': steps})


if __name__ == '__main__':
    app.run(debug=True)
