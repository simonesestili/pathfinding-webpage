/*

Grid value key
0: Clear
1: Blocked
2: Water
3: Start
5: End

*/

const SIDE_LENGTH = 20;
const COLORS = {
    0: 'white',
    1: '#242526',
    2: '#5abcd8',
    3: '#097969',
    5: '#880808',
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
const algos = [dijkstra, astar];

// State variables
let grid = null;
let mousedown = false;
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
    console.log('up');
});

const resetTable = () => {
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

const selectCell = (e) => {
    mousedown = true;
    hoveringCell(e);
    mousedown = false;
};

const hoveringCell = (e) => {
    if (!mousedown) return;
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
    if (grid[row][col] === color) return;
    grid[row][col] = color;

    const td = document.getElementById(`${row}-${col}`);
    td.style.backgroundColor = COLORS[color];
};

const shadeEditors = () => {
    editors.forEach((editor) => {
        editor.style.opacity = editingSetting === editor.id ? 1 : 0.6;
    });
};

const shadeAlgos = () => {
    algos.forEach((algo) => {
        algo.style.opacity = algoSetting === algo.id ? 1 : 0.6;
    });
};

clear.addEventListener('click', resetTable);
erase.addEventListener('click', () => {
    editingSetting = editingSetting === 'erase' ? '' : 'erase';
    shadeEditors();
});
obstacle.addEventListener('click', () => {
    editingSetting = editingSetting === 'obstacle' ? '' : 'obstacle';
    shadeEditors();
});
water.addEventListener('click', () => {
    editingSetting = editingSetting === 'water' ? '' : 'water';
    shadeEditors();
});
start.addEventListener('click', () => {
    editingSetting = editingSetting === 'start' ? '' : 'start';
    shadeEditors();
});
finish.addEventListener('click', () => {
    editingSetting = editingSetting === 'finish' ? '' : 'finish';
    shadeEditors();
});

dijkstra.addEventListener('click', () => {
    algoSetting = 'dijkstra';
    shadeAlgos();
});
astar.addEventListener('click', () => {
    algoSetting = 'astar';
    shadeAlgos();
});

resetTable();
shadeAlgos();
