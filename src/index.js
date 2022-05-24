function BinaryHeap() {
    let list = [];

    //Heapify
    this.minHeapify = (arr, n, i) => {
        let smallest = i;
        let l = 2 * i + 1; //left child index
        let r = 2 * i + 2; //right child index

        //If left child is smaller than root
        if (l < n && arr[l] < arr[smallest]) {
            smallest = l;
        }

        // If right child is smaller than smallest so far
        if (r < n && arr[r] < arr[smallest]) {
            smallest = r;
        }

        // If smallest is not root
        if (smallest != i) {
            let temp = arr[i];
            arr[i] = arr[smallest];
            arr[smallest] = temp;

            // Recursively heapify the affected sub-tree
            this.minHeapify(arr, n, smallest);
        }
    };

    //Insert Value
    this.insert = (num) => {
        const size = list.length;

        if (size === 0) {
            list.push(num);
        } else {
            list.push(num);

            //Heapify
            for (let i = parseInt(list.length / 2 - 1); i >= 0; i--) {
                this.minHeapify(list, list.length, i);
            }
        }
    };

    //Remove value
    this.delete = (num) => {
        const size = list.length;

        //Get the index of the number to be removed
        let i;
        for (i = 0; i < size; i++) {
            if (list[i] === num) {
                break;
            }
        }

        //Swap the number with last element
        [list[i], list[size - 1]] = [list[size - 1], list[i]];

        //Remove the last element
        list.splice(size - 1);

        //Heapify the list again
        for (let i = parseInt(list.length / 2 - 1); i >= 0; i--) {
            this.minHeapify(list, list.length, i);
        }
    };

    //Return min value
    this.findMin = () => list[0];

    //Remove min val
    this.deleteMin = () => {
        this.delete(list[0]);
    };

    //Remove and return min value
    this.extractMin = () => {
        const min = list[0];
        this.delete(min);
        return min;
    };

    //Size
    this.size = () => list.length;

    //IsEmpty
    this.isEmpty = () => list.length === 0;

    //Return head
    this.getList = () => list;
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
const algos = [dijkstra, astar];

// State variables
let grid = null;
let mousedown = false;
let running = false;
let editingSetting = '';
let algoSetting = 'dijkstra';
let [effort, visitedCnt] = [0, 0];
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

// Draws path and highlights visited cells
const runDijkstra = async () => {
    running = true;
    const parent = new Map();
    const dists = new Map();
    parent.set(`${rstart}, ${cstart}`, [null, null]);
    dists.set(`${rstart}, ${cstart}`, 0);
    const heap = new BinaryHeap();
    heap.insert([0, rstart, cstart]);

    let [dist, row, col] = [0, 0, 0];
    let [dr, dc] = [0, 0];
    while (heap.size() > 0) {
        [dist, row, col] = heap.extractMin();

        let flag = false;
        for (let [r, c] of DIRS) {
            [dr, dc] = [row + r, col + c];
            if (
                dr < 0 ||
                dc < 0 ||
                dr >= SIDE_LENGTH ||
                dc >= SIDE_LENGTH ||
                grid[dr][dc] === 1
            ) {
                continue;
            }
            let extra = r && c ? 14 : 10;
            if (grid[dr][dc] == 2) extra *= 2;
            console.log(dists.get(`${dr}, ${dc}`));
            if (
                dists.has(`${dr}, ${dc}`) &&
                dists.get(`${dr}, ${dc}`) <= dist + extra
            )
                continue;
            heap.insert([dist + extra, dr, dc]);
            parent.set(`${dr}, ${dc}`, [row, col]);
            dists.set(`${dr}, ${dc}`, dist + extra);
            console.log(dr + ' ' + dc + ' ' + (dist + extra));

            if (dr !== rfinish || dc !== cfinish) updateCell(dr, dc, 7);
            else {
                flag = true;
                break;
            }
        }
        if (flag) break;

        await delay(10);
    }
    let [currRow, currCol] = parent.get(`${rfinish}, ${cfinish}`);

    while (currRow !== rstart || currCol !== cstart) {
        updateCell(currRow, currCol, 6);
        [currRow, currCol] = parent.get(`${currRow}, ${currCol}`);
        await delay(50);
    }

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
