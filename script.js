document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const cellSize = 40;
    const gridSize = 10;
    canvas.width = cellSize * gridSize;
    canvas.height = cellSize * gridSize;

    let player = { x: 0, y: 0 };
    let goal = { x: gridSize - 1, y: gridSize - 1 };
    let currentStage = 0;
    let currentVariation = 0;
    let maze = [];
    let cleanMaze = []; // Maze with 'P' and 'E' converted to 0 for movement
    let keys = {};
    let lastTouchTime = 0;
    const touchDelay = 200; // Debounce touch events (ms)
    let canMove = true; // Flag to control player movement

    // Load sounds
    const wallHitSound = new Audio('wall_hit.mp3');
    wallHitSound.preload = 'auto';
    wallHitSound.volume = 0.5;

    const moveSound = new Audio('move.mp3');
    moveSound.preload = 'auto';
    moveSound.volume = 0.5;

    const stageCompleteSound = new Audio('stage_complete.mp3');
    stageCompleteSound.preload = 'auto';
    stageCompleteSound.volume = 0.5;

    // Message elements
    const wallHitMessage = document.getElementById('wall-hit-message');
    const stageCompleteMessage = document.getElementById('stage-complete-message');
    const allStagesCompleteMessage = document.getElementById('all-stages-complete-message');

    // Maze variations for each stage (4 stages, 5 variations each)
    const mazes = [
        // Stage 1: Simple mazes
        [
            [
                [ 0, 0, 0, 0, 1, 0, 0, 0, 0, 0 ], 
                [ 0, 1, 1, 0, 1, 0, 1, 1, 1, 1 ], 
                [ 0, 1, 0, 0, 1, 0, 0, 0, 0, 0 ], 
                [ 0, 1, 0, 1, 1, 1, 1, 1, 1, 0 ], 
                [ 0, 1, 0, 0, 1, 0, 0, 0, 0, 'E' ], 
                [ 0, 1, 1, 0, 0, 0, 1, 1, 1, 0 ], 
                [ 0, 1, 0, 0, 1, 1, 1, 0, 0, 0 ], 
                [ 'P', 1, 1, 1, 1, 0, 1, 1, 1, 0 ], 
                [ 0, 0, 0, 0, 1, 0, 0, 0, 1, 0 ], 
                [ 0, 1, 1, 0, 0, 0, 1, 0, 1, 0 ]
            ],
            [
                [ 0, 1, 0, 0, 0, 1, 0, 0, 0, 0 ], 
                [ 0, 1, 0, 0, 1, 1, 0, 0, 0, 1 ], 
                [ 0, 0, 0, 1, 1, 0, 0, 1, 'P', 0 ], 
                [ 0, 1, 1, 1, 0, 0, 1, 1, 1, 0 ], 
                [ 0, 0, 1, 0, 0, 1, 1, 0, 0, 0 ], 
                [ 0, 0, 0, 0, 1, 1, 0, 0, 1, 0 ], 
                [ 0, 1, 'E', 1, 1, 0, 0, 1, 1, 0 ], 
                [ 0, 1, 0, 0, 1, 0, 0, 0, 1, 0 ], 
                [ 0, 1, 1, 0, 1, 0, 1, 1, 1, 0 ], 
                [ 0, 0, 0, 0, 1, 0, 0, 0, 0, 0 ]
            ],
            [
                [ 0, 0, 0, 0, 1, 0, 1, 0, 0, 0 ], 
                [ 0, 1, 1, 0, 1, 0, 1, 0, 1, 0 ], 
                [ 1, 1, 0, 0, 1, 0, 0, 0, 1, 0 ], 
                [ 0, 0, 0, 1, 1, 1, 1, 1, 1, 0 ], 
                [ 0, 1, 0, 1, 0, 0, 0, 0, 1, 0 ], 
                [ 0, 1, 0, 1, 0, 1, 1, 0, 1, 0 ], 
                [ 0, 1, 0, 1, 0, 1, 1, 0, 1, 0 ], 
                [ 0, 1, 0, 1, 'P', 1, 1, 0, 1, 'E' ], 
                [ 0, 1, 1, 1, 0, 1, 1, 0, 1, 0 ], 
                [ 0, 0, 0, 0, 0, 1, 1, 0, 0, 0 ]
            ],
            [
                [ 'P', 0, 0, 1, 0, 0, 0, 0, 0, 0 ], 
                [ 0, 1, 0, 1, 1, 1, 1, 1, 1, 0 ], 
                [ 0, 1, 0, 1, 0, 0, 0, 0, 0, 0 ], 
                [ 0, 1, 0, 1, 0, 1, 1, 1, 1, 0 ], 
                [ 0, 1, 0, 0, 0, 1, 0, 'E', 1, 0 ], 
                [ 0, 1, 1, 1, 1, 1, 0, 1, 1, 0 ], 
                [ 0, 1, 0, 0, 0, 0, 0, 0, 0, 0 ], 
                [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 0 ], 
                [ 0, 1, 0, 0, 0, 0, 0, 0, 1, 0 ], 
                [ 0, 0, 0, 1, 1, 1, 1, 0, 1, 0 ]
            ],
            [
                [ 0, 0, 0, 0, 0, 'E', 0, 0, 0, 0 ], 
                [ 1, 1, 1, 1, 1, 1, 1, 0, 1, 0 ], 
                [ 0, 0, 0, 0, 0, 0, 0, 0, 1, 0 ], 
                [ 0, 1, 1, 1, 0, 0, 1, 1, 1, 1 ], 
                [ 0, 0, 0, 1, 1, 1, 1, 0, 0, 0 ], 
                [ 0, 1, 0, 0, 0, 0, 1, 'P', 1, 0 ], 
                [ 0, 1, 1, 1, 1, 0, 1, 1, 1, 0 ], 
                [ 0, 1, 0, 0, 0, 0, 0, 0, 1, 0 ], 
                [ 0, 1, 0, 1, 1, 1, 1, 1, 1, 0 ], 
                [ 0, 1, 0, 0, 0, 0, 0, 0, 0, 0 ]
            ]
        ],
        // Stage 2: Medium difficulty
        [
            [
                [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 'E' ], 
                [ 1, 0, 0, 0, 0, 0, 0, 0, 1, 0 ], 
                [ 1, 0, 1, 1, 1, 1, 1, 0, 1, 0 ], 
                [ 1, 0, 1, 0, 0, 0, 1, 0, 1, 0 ], 
                [ 1, 0, 1, 0, 1, 'P', 1, 0, 1, 0 ], 
                [ 1, 0, 1, 0, 1, 1, 1, 0, 1, 0 ], 
                [ 1, 0, 1, 0, 0, 0, 0, 0, 1, 0 ], 
                [ 1, 0, 1, 1, 1, 1, 1, 1, 1, 0 ], 
                [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0 ], 
                [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ]
            ],
            [
                [ 0, 'P', 1, 1, 0, 0, 0, 0, 0, 0 ], 
                [ 0, 0, 1, 1, 0, 0, 0, 0, 0, 0 ], 
                [ 0, 0, 1, 1, 0, 0, 1, 1, 1, 1 ], 
                [ 0, 0, 1, 1, 0, 0, 1, 1, 1, 1 ], 
                [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ], 
                [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ], 
                [ 1, 1, 1, 1, 0, 0, 1, 1, 0, 0 ], 
                [ 1, 1, 1, 1, 0, 0, 1, 1, 0, 0 ], 
                [ 0, 0, 0, 0, 0, 0, 1, 1, 0, 0 ], 
                [ 0, 0, 0, 0, 0, 0, 1, 1, 'E', 0 ]
            ],
            [
                [ 0, 0, 'P', 1, 1, 1, 1, 'E', 0, 0 ], 
                [ 0, 0, 1, 1, 0, 0, 1, 1, 0, 0 ], 
                [ 0, 0, 1, 0, 0, 0, 0, 1, 0, 0 ], 
                [ 0, 0, 1, 1, 0, 0, 1, 1, 0, 0 ], 
                [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ], 
                [ 0, 0, 0, 1, 0, 0, 1, 0, 0, 0 ], 
                [ 0, 1, 1, 1, 0, 0, 1, 1, 1, 0 ], 
                [ 1, 1, 0, 0, 0, 0, 0, 0, 1, 1 ], 
                [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 1 ], 
                [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ]
            ],
            [
                [ 0, 0, 0, 0, 1, 1, 'P', 0, 0, 0 ], 
                [ 0, 0, 0, 1, 1, 1, 1, 0, 0, 0 ], 
                [ 0, 0, 1, 1, 1, 1, 1, 1, 0, 0 ], 
                [ 0, 1, 1, 0, 1, 1, 0, 1, 1, 0 ], 
                [ 0, 1, 0, 0, 1, 1, 0, 0, 1, 0 ], 
                [ 0, 1, 0, 0, 1, 1, 0, 0, 1, 0 ], 
                [ 0, 1, 1, 0, 1, 1, 0, 1, 1, 0 ], 
                [ 0, 0, 1, 1, 1, 1, 1, 1, 0, 0 ], 
                [ 0, 0, 0, 1, 1, 1, 1, 0, 0, 0 ], 
                [ 0, 0, 0, 0, 1, 1, 'E', 0, 0, 0 ]
            ],
            [
                [ 0, 0, 0, 0, 1, 0, 0, 0, 0, 0 ], 
                [ 0, 0, 0, 1, 0, 0, 0, 0, 0, 0 ], 
                [ 0, 0, 1, 'E', 0, 0, 0, 0, 0, 0 ], 
                [ 0, 0, 0, 1, 0, 0, 0, 0, 1, 0 ], 
                [ 0, 0, 0, 'P', 1, 0, 0, 1, 0, 0 ], 
                [ 0, 0, 0, 1, 0, 0, 1, 0, 0, 0 ], 
                [ 0, 0, 1, 0, 0, 0, 0, 1, 0, 0 ], 
                [ 0, 0, 0, 0, 0, 0, 0, 0, 1, 0 ], 
                [ 0, 0, 0, 0, 0, 0, 0, 1, 0, 0 ], 
                [ 0, 0, 0, 0, 0, 0, 1, 0, 0, 0 ]
            ]
        ],
        // Stage 3: Hard
        [
            [
                [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ], 
                [ 1, 0, 0, 0, 1, 1, 0, 0, 0, 1 ], 
                [ 1, 0, 1, 0, 0, 0, 0, 1, 0, 1 ], 
                [ 1, 0, 1, 1, 1, 1, 1, 1, 0, 1 ], 
                [ 1, 0, 0, 0, 0, 0, 1, 0, 0, 1 ], 
                [ 1, 1, 1, 1, 1, 'P', 1, 0, 1, 1 ], 
                [ 1, 0, 0, 0, 1, 1, 1, 0, 1, 'E' ], 
                [ 1, 0, 1, 0, 0, 0, 0, 0, 1, 0 ], 
                [ 1, 0, 1, 1, 1, 1, 1, 1, 1, 0 ], 
                [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
            ],
            [
                [ 1, 1, 1, 1, 1, 0, 0, 0, 0, 0 ], 
                [ 0, 0, 0, 0, 1, 0, 1, 1, 1, 0 ], 
                [ 0, 1, 1, 0, 1, 0, 1, 0, 1, 0 ], 
                [ 0, 1, 'E', 0, 1, 0, 1, 0, 0, 0 ], 
                [ 0, 1, 1, 1, 1, 0, 1, 1, 1, 0 ], 
                [ 0, 0, 0, 0, 0, 0, 0, 0, 1, 1 ], 
                [ 0, 1, 1, 1, 1, 0, 1, 1, 1, 0 ], 
                [ 0, 1, 0, 0, 1, 0, 1, 0, 0, 0 ], 
                [ 0, 1, 1, 0, 1, 0, 0, 0, 1, 0 ], 
                [ 0, 0, 0, 0, 1, 'P', 1, 0, 1, 0 ]
            ],
            [
                [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ], 
                [ 0, 0, 0, 1, 'P', 0, 1, 0, 0, 0 ], 
                [ 0, 0, 0, 1, 0, 0, 1, 0, 0, 0 ], 
                [ 0, 0, 0, 1, 0, 0, 1, 0, 0, 0 ], 
                [ 0, 0, 0, 1, 0, 0, 1, 0, 0, 0 ], 
                [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ], 
                [ 0, 1, 0, 0, 0, 0, 0, 0, 1, 0 ], 
                [ 0, 0, 1, 0, 0, 0, 0, 1, 0, 0 ], 
                [ 0, 0, 0, 1, 1, 1, 1, 0, 0, 0 ], 
                [ 0, 0, 0, 0, 'E', 0, 0, 0, 0, 0 ]
            ],
            [
                [ 0, 1, 1, 0, 0, 0, 1, 0, 0, 0 ], 
                [ 0, 0, 0, 0, 1, 1, 1, 0, 1, 0 ], 
                [ 0, 0, 1, 0, 0, 0, 1, 'E', 1, 0 ], 
                [ 0, 1, 1, 0, 1, 1, 1, 1, 1, 0 ], 
                [ 0, 0, 1, 0, 0, 0, 0, 1, 0, 0 ], 
                [ 1, 0, 0, 0, 1, 1, 0, 1, 0, 1 ], 
                [ 1, 0, 1, 0, 1, 0, 0, 1, 0, 0 ], 
                [ 0, 0, 1, 0, 1, 0, 1, 1, 1, 0 ], 
                [ 0, 1, 1, 1, 1, 0, 1, 0, 0, 0 ], 
                [ 0, 0, 0, 'P', 1, 0, 0, 0, 0, 0 ]
            ],
            [
                [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 'P' ], 
                [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1 ], 
                [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ], 
                [ 1, 1, 1, 1, 1, 1, 0, 1, 1, 1 ], 
                [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ], 
                [ 1, 1, 1, 1, 1, 1, 1, 1, 0, 1 ], 
                [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ], 
                [ 1, 1, 1, 1, 1, 1, 0, 1, 1, 1 ], 
                [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ], 
                [ 1, 1, 'E', 1, 1, 1, 1, 1, 1, 1 ]
            ]
        ],
        // Stage 4: Very hard
        [
            [
                [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ], 
                [ 1, 'P', 0, 1, 1, 1, 1, 1, 1, 1 ], 
                [ 1, 1, 0, 1, 1, 0, 0, 0, 0, 1 ], 
                    [ 1, 1, 0, 0, 0, 0, 1, 1, 0, 1 ], 
                [ 1, 1, 1, 1, 1, 1, 1, 1, 0, 1 ], 
                [ 1, 0, 0, 0, 0, 0, 1, 1, 0, 1 ], 
                [ 1, 0, 1, 1, 1, 0, 0, 0, 0, 1 ], 
                [ 1, 0, 0, 0, 1, 1, 1, 1, 1, 1 ], 
                [ 1, 1, 1, 0, 0, 0, 0, 0, 'E', 1 ], 
                [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ]
            ],
            [
                [ 0, 0, 0, 0, 'E', 0, 0, 0, 0, 0 ], 
                [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 0 ], 
                [ 0, 0, 0, 0, 1, 1, 0, 0, 0, 0 ], 
                [ 1, 1, 1, 0, 1, 1, 0, 1, 1, 1 ], 
                [ 0, 0, 0, 0, 1, 1, 0, 0, 0, 0 ], 
                [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 0 ], 
                [ 0, 1, 0, 0, 0, 0, 0, 0, 1, 0 ], 
                [ 0, 1, 0, 1, 0, 0, 1, 0, 1, 0 ], 
                [ 0, 1, 0, 1, 0, 0, 1, 0, 1, 0 ], 
                [ 0, 0, 0, 1, 0, 'P', 1, 0, 0, 0 ]
            ],
            [
                [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ], 
                [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 1 ], 
                [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 1 ], 
                [ 1, 0, 1, 1, 0, 0, 1, 1, 0, 1 ], 
                [ 1, 0, 1, 1, 0, 'P', 1, 1, 0, 1 ], 
                [ 1, 0, 0, 0, 1, 1, 0, 0, 0, 1 ], 
                [ 1, 0, 0, 1, 1, 1, 1, 0, 0, 1 ], 
                [ 1, 0, 0, 1, 'E', 0, 1, 0, 0, 1 ], 
                [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 1 ], 
                [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ]
            ],
            [
                [ 1, 1, 'E', 0, 1, 1, 0, 0, 1, 1 ], 
                [ 1, 1, 0, 0, 1, 1, 0, 0, 1, 1 ], 
                [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ], 
                [ 0, 0, 1, 1, 0, 0, 1, 1, 0, 0 ], 
                [ 0, 0, 1, 1, 0, 0, 1, 1, 0, 0 ], 
                [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ], 
                [ 1, 1, 0, 0, 1, 1, 0, 0, 1, 1 ], 
                [ 1, 1, 0, 0, 1, 1, 0, 0, 1, 1 ], 
                [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ], 
                [ 0, 0, 1, 1, 0, 0, 1, 1, 0, 'P' ]
            ],
            [
                [ 0, 0, 0, 0, 0, 0, 0, 1, 1, 1 ], 
                [ 0, 1, 1, 1, 1, 1, 0, 0, 0, 1 ], 
                [ 'E', 1, 0, 0, 0, 1, 1, 1, 0, 1 ], 
                [ 1, 1, 0, 1, 0, 0, 0, 0, 0, 1 ], 
                [ 1, 0, 0, 1, 1, 1, 1, 1, 1, 1 ], 
                [ 1, 0, 1, 1, 0, 0, 0, 0, 0, 1 ], 
                [ 1, 0, 0, 0, 0, 1, 1, 1, 0, 1 ], 
                [ 1, 1, 1, 1, 1, 1, 0, 0, 0, 0 ], 
                [ 1, 0, 0, 0, 0, 1, 0, 1, 1, 0 ], 
                [ 1, 'P', 1, 1, 0, 0, 0, 1, 0, 0 ]
            ]
        ]
    ];

    function loadMaze() {
        // Select a random variation for the current stage
        currentVariation = Math.floor(Math.random() * mazes[currentStage].length);
        maze = mazes[currentStage][currentVariation];
        cleanMaze = maze.map(row => row.slice()); // Deep copy
        // Find player ('P') and exit ('E') positions
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                if (maze[y][x] === 'P') {
                    player.x = x;
                    player.y = y;
                    cleanMaze[y][x] = 0; // Treat 'P' as path
                } else if (maze[y][x] === 'E') {
                    goal.x = x;
                    goal.y = y;
                    cleanMaze[y][x] = 0; // Treat 'E' as path
                }
            }
        }
        document.getElementById('status').textContent = `Stage ${currentStage + 1}, Variation ${currentVariation + 1}`;
        canMove = true; // Allow movement on maze load
        wallHitMessage.classList.remove('show');
        stageCompleteMessage.classList.remove('show');
        allStagesCompleteMessage.classList.remove('show');
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Draw maze (walls and paths same color)
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                ctx.fillStyle = '#ccc'; // Same color for walls and paths
                ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                ctx.strokeStyle = '#999';
                ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }
        // Draw player
        ctx.fillStyle = 'blue';
        ctx.fillRect(player.x * cellSize + 5, player.y * cellSize + 5, cellSize - 10, cellSize - 10);
        // Draw goal
        ctx.fillStyle = 'green';
        ctx.fillRect(goal.x * cellSize + 5, goal.y * cellSize + 5, cellSize - 10, cellSize - 10);
    }

    function movePlayer(dx, dy) {
        if (!canMove) return; // Prevent movement if locked

        let newX = player.x + dx;
        let newY = player.y + dy;
        if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize && !cleanMaze[newY][newX]) {
            player.x = newX;
            player.y = newY;
            // Play movement sound
            moveSound.currentTime = 0;
            moveSound.play().catch(error => {
                console.error('Error playing move sound:', error);
            });
            if (player.x === goal.x && player.y === goal.y) {
                // Play stage completion sound
                stageCompleteSound.currentTime = 0;
                stageCompleteSound.play().catch(error => {
                    console.error('Error playing stage complete sound:', error);
                });
                // Show stage completion message
                stageCompleteMessage.textContent = `ТЫ ПРОШЕЛ ${currentStage + 1} ЭТАП`;
                stageCompleteMessage.classList.add('show');
                canMove = false; // Lock movement during message
                setTimeout(() => {
                    stageCompleteMessage.classList.remove('show');
                    currentStage++;
                    if (currentStage >= mazes.length) {
                        // Show all stages complete message instead of alert
                        allStagesCompleteMessage.classList.add('show');
                        setTimeout(() => {
                            allStagesCompleteMessage.classList.remove('show');
                            currentStage = 0;
                            currentVariation = 0;
                            loadMaze();
                            draw();
                        }, 7000); // 7-second delay for all stages complete message
                    } else {
                        currentVariation = 0;
                        loadMaze();
                        draw();
                    }
                }, 7000); // 7-second delay for stage complete message
            }
        } else if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize && cleanMaze[newY][newX]) {
            // Play wall hit sound
            wallHitSound.currentTime = 0;
            wallHitSound.play().catch(error => {
                console.error('Error playing wall hit sound:', error);
            });
            // Show wall hit message and lock movement
            wallHitMessage.classList.add('show');
            canMove = false;
            setTimeout(() => {
                wallHitMessage.classList.remove('show');
                // Select a random variation for the current stage
                currentVariation = Math.floor(Math.random() * mazes[currentStage].length);
                loadMaze();
                draw(); // Redraw canvas to show player at reset position
            }, 2000); // 2-second delay
        }
        draw();
    }

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;
        if (keys['w'] || e.key === 'ArrowUp') movePlayer(0, -1);
        if (keys['s'] || e.key === 'ArrowDown') movePlayer(0, 1);
        if (keys['a'] || e.key === 'ArrowLeft') movePlayer(-1, 0);
        if (keys['d'] || e.key === 'ArrowRight') movePlayer(1, 0);
    });

    document.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
    });

    // Button controls for both click and touch
    function handleButtonPress(direction, dx, dy) {
        const currentTime = Date.now();
        if (currentTime - lastTouchTime > touchDelay) {
            lastTouchTime = currentTime;
            console.log(`${direction} button pressed`);
            movePlayer(dx, dy);
        }
    }

    const buttons = [
        { id: 'up', dx: 0, dy: -1 },
        { id: 'down', dx: 0, dy: 1 },
        { id: 'left', dx: -1, dy: 0 },
        { id: 'right', dx: 1, dy: 0 }
    ];

    buttons.forEach(button => {
        const element = document.getElementById(button.id);
        element.addEventListener('click', () => handleButtonPress(button.id, button.dx, button.dy));
        element.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleButtonPress(button.id, button.dx, button.dy);
        });
    });

    // Initialize game
    loadMaze();
    draw();
});