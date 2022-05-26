class Moves {
    constructor() {
        this.list = [];
    }

    insert(elem) {
        this.list.push(elem);
    }

    pop(elem) {
        this.list.sort((a, b) => b[0] - a[0]);
        return this.list.pop();
    }

    size() {
        return this.list.length;
    }
}

/*

Grid value key
0: Clear
1: Blocked
2: Water
3: Start
5: End
6: Path
7: Visited

*/

const SIDE_LENGTH = 20;
const DIRS = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
];
const COLORS = {
    0: 'white',
    1: '#242526',
    2: '#5abcd8',
    3: '#097969',
    5: '#880808',
    6: '#e4c1f9',
    7: '#fcf6bd',
    8: '#bdfcdf',
};

// Elements
const TABLE = document.getElementById('grid');
const html = document.getElementById('main');
const clear = document.getElementById('clear');
const erase = document.getElementById('erase');
const obstacle = document.getElementById('obstacle');
const water = document.getElementById('water');
const start = document.getElementById('start');
const finish = document.getElementById('finish');
const editors = [erase, obstacle, water, start, finish];
const dijkstra = document.getElementById('dijkstra');
const astar = document.getElementById('astar');
const run = document.getElementById('run');
const effortStat = document.getElementById('effort');
const cellsVisitedStat = document.getElementById('cells-visited');
const algos = [dijkstra, astar];

// State variables
let grid = null;
let mousedown = false;
let running = false;
let painted = false;
let editingSetting = '';
let algoSetting = 'dijkstra';
let [rstart, cstart] = [0, 0];
let [rfinish, cfinish] = [SIDE_LENGTH - 1, SIDE_LENGTH - 1];

// Click state manager
html.addEventListener('mousedown', (e) => {
    mousedown = true;
});
html.addEventListener('mouseup', () => {
    mousedown = false;
});

// Sleeps program
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// Clears table
const resetTable = () => {
    effortStat.innerHTML = 0;
    cellsVisitedStat.innerHTML = 0;
    if (running) return;
    TABLE.innerHTML = '';
    grid = new Array(SIDE_LENGTH);
    [rstart, cstart] = [0, 0];
    [rfinish, cfinish] = [SIDE_LENGTH - 1, SIDE_LENGTH - 1];
    let [tr, td] = [null, null];
    for (let row = 0; row < SIDE_LENGTH; row++) {
        grid[row] = new Array(SIDE_LENGTH);
        tr = document.createElement('tr');
        tr.id = row;

        for (let col = 0; col < SIDE_LENGTH; col++) {
            td = document.createElement('td');
            td.id = `${row}-${col}`;
            td.addEventListener('mousedown', selectCell);
            td.addEventListener('mouseenter', hoveringCell);
            tr.appendChild(td);
            grid[row][col] = 0;
        }

        TABLE.appendChild(tr);
    }

    updateCell(rstart, cstart, 3);
    updateCell(rfinish, cfinish, 5);
};

// Mouse down on cell
const selectCell = (e) => {
    if (running) return;
    mousedown = true;
    hoveringCell(e);
    mousedown = false;
};

// Edit cell
const hoveringCell = (e) => {
    if (!mousedown || running) return;
    if (painted) unpaint();
    const [row, col] = e.srcElement.id.split('-').map((x) => parseInt(x));

    if (editingSetting === 'start' || editingSetting === 'finish') {
        if (grid[row][col] & 1) return;
        if (editingSetting === 'start') {
            updateCell(rstart, cstart, 0);
            [rstart, cstart] = [row, col];
            updateCell(rstart, cstart, 3);
        } else {
            updateCell(rfinish, cfinish, 0);
            [rfinish, cfinish] = [row, col];
            updateCell(rfinish, cfinish, 5);
        }
    } else if (editingSetting !== '') {
        if (grid[row][col] >= 3) return;
        updateCell(
            row,
            col,
            editingSetting === 'erase'
                ? 0
                : editingSetting === 'obstacle'
                ? 1
                : 2
        );
    }
};

// Assumes we have a valid grid
const updateCell = (row, col, color) => {
    grid[row][col] = color >= 6 ? grid[row][col] : color;
    const td = document.getElementById(`${row}-${col}`);
    td.style.backgroundColor = COLORS[color];
};

// Removes path and visited nodes highlights
const unpaint = () => {
    effortStat.innerHTML = 0;
    cellsVisitedStat.innerHTML = 0;
    for (let row = 0; row < SIDE_LENGTH; row++) {
        for (let col = 0; col < SIDE_LENGTH; col++) {
            updateCell(row, col, grid[row][col]);
        }
    }

    painted = false;
};

// Shade selected editor
const shadeEditors = () => {
    editors.forEach((editor) => {
        editor.style.opacity = editingSetting === editor.id ? 1 : 0.6;
    });
};

// Shade selected algo
const shadeAlgos = () => {
    algos.forEach((algo) => {
        algo.style.opacity = algoSetting === algo.id ? 1 : 0.6;
    });
};

const canVisit = (row, col) =>
    row >= 0 &&
    col >= 0 &&
    row < SIDE_LENGTH &&
    col < SIDE_LENGTH &&
    grid[row][col] !== 1;

// Draws path and highlights visited cells
const runDijkstra = async () => {
    running = true;
    const heap = new Moves();
    const parent = new Array(SIDE_LENGTH);
    const dists = new Array(SIDE_LENGTH);
    for (let i = 0; i < SIDE_LENGTH; i++) {
        parent[i] = new Array(SIDE_LENGTH);
        dists[i] = new Array(SIDE_LENGTH);
        for (let j = 0; j < SIDE_LENGTH; j++) {
            parent[i][j] = [null, null];
            dists[i][j] = Number.POSITIVE_INFINITY;
        }
    }
    heap.insert([0, rstart, cstart]);
    dists[0][0] = 0;
    let [dist, row, col, weight, dr, dc, vis] = [0, 0, 0, 0, 0, 0, 1];
    while (heap.size() > 0) {
        [dist, row, col] = heap.pop();

        let flag = false;
        for (let [r, c] of DIRS) {
            [dr, dc] = [row + r, col + c];
            if (!canVisit(dr, dc)) continue;

            weight = r !== 0 && c !== 0 ? 14 : 10;
            if (grid[dr][dc] === 2) weight *= 2;
            if (dist + weight >= dists[dr][dc]) continue;

            // Traverse neighbor
            heap.insert([dist + weight, dr, dc]);
            vis += dists[dr][dc] === Number.POSITIVE_INFINITY;
            dists[dr][dc] = dist + weight;
            parent[dr][dc] = [row, col];

            // Paint as visited
            if (dr !== rfinish || dc !== cfinish)
                updateCell(dr, dc, 7 + (grid[dr][dc] === 2));
            else {
                flag = true;
                break;
            }
        }
        cellsVisitedStat.innerHTML = vis;
        if (flag) break;
        await delay(10);
    }

    // Paint the optimal path
    let [currRow, currCol] = parent[rfinish][cfinish];
    let [prevRow, prevCol] = [0, 0];
    let effort = dists[rfinish][cfinish] - dists[currRow][currCol];
    while (currRow !== rstart || currCol !== cstart) {
        updateCell(currRow, currCol, 6);
        [prevRow, prevCol] = [currRow, currCol];
        [currRow, currCol] = parent[currRow][currCol];
        effort += dists[prevRow][prevCol] - dists[currRow][currCol];
        effortStat.innerHTML = effort;
        await delay(50);
    }

    painted = true;
    running = false;
};

clear.addEventListener('click', resetTable);
erase.addEventListener('click', () => {
    if (running) return;
    editingSetting = editingSetting === 'erase' ? '' : 'erase';
    shadeEditors();
});
obstacle.addEventListener('click', () => {
    if (running) return;
    editingSetting = editingSetting === 'obstacle' ? '' : 'obstacle';
    shadeEditors();
});
water.addEventListener('click', () => {
    if (running) return;
    editingSetting = editingSetting === 'water' ? '' : 'water';
    shadeEditors();
});
start.addEventListener('click', () => {
    if (running) return;
    editingSetting = editingSetting === 'start' ? '' : 'start';
    shadeEditors();
});
finish.addEventListener('click', () => {
    if (running) return;
    editingSetting = editingSetting === 'finish' ? '' : 'finish';
    shadeEditors();
});

dijkstra.addEventListener('click', () => {
    if (running) return;
    algoSetting = 'dijkstra';
    shadeAlgos();
});
astar.addEventListener('click', () => {
    if (running) return;
    algoSetting = 'astar';
    shadeAlgos();
});
run.addEventListener('click', async () => {
    if (running) return;
    running = true;

    // Draw path and visited
    if (algoSetting === 'dijkstra') {
        await runDijkstra();
    }

    running = false;
});

resetTable();
shadeAlgos();
