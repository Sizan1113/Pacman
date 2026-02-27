
let gameStarted = false;
let gameOver = false;

let score = 0;
let lives = 3;
let level = 1;

let direction = null;
let invincible = false;
let playerSpeed = 180;
let enemySpeed = 500;

let playerColor = "yellow";

// SELECT ELEMENTS
const main = document.querySelector("main");
const startDiv = document.querySelector(".startDiv");
const scoreDisplay = document.querySelector(".score p");
const livesContainer = document.querySelector(".lives ul");
const leaderboard = document.querySelector(".leaderboard ol");

// TILE TYPES
// 0 = point | 1 = wall | 2 = player | 3 = enemy | 4 = empty floor | 5 = power-up
let maze = [];

// LEVEL SYSTEM 
function setupLevel() {
    maze = generateRandomMaze(10, 10, level + 2);
    spawnEnemies(Math.min(level, 10));
    spawnPowerUp();
    buildMaze();
}

//  RANDOM MAZE GENERATOR
function generateRandomMaze(rows, cols, difficulty) {
    let m = [];
    let pointCount = 0;

    // INITIAL MAZE
    for (let y = 0; y < rows; y++) {
        let row = [];
        for (let x = 0; x < cols; x++) {
            if (y === 0 || y === rows - 1 || x === 0 || x === cols - 1) {
                row.push(1); // walls on border
            } else {
                let val = Math.random();
                if (val < 0.15) row.push(1); // fewer walls
                else row.push(0); // point
                if (row[x] === 0) pointCount++;
            }
        }
        m.push(row);
    }

    //  PLACE PLAYER
    let px, py;
    do {
        px = Math.floor(Math.random() * (cols - 2)) + 1;
        py = Math.floor(Math.random() * (rows - 2)) + 1;
    } while (m[py][px] !== 0);
    m[py][px] = 2;

    // ENSURE MINIMUM POINTS
    while (pointCount < 10) {
        let rx = Math.floor(Math.random() * (cols - 2)) + 1;
        let ry = Math.floor(Math.random() * (rows - 2)) + 1;
        if (m[ry][rx] === 1) continue;
        m[ry][rx] = 0;
        pointCount++;
    }

    //  ENSURE REACHABLE POINTS
    const reachable = getReachablePoints(m, px, py);
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (m[y][x] === 0 && !reachable.some(p => p.x === x && p.y === y)) {
                m[y][x] = 4; // convert unreachable point to empty floor
            }
        }
    }

    return m;
}

// BFS TO FIND REACHABLE POINTS
function getReachablePoints(m, px, py) {
    let visited = Array.from({ length: m.length }, () => Array(m[0].length).fill(false));
    let queue = [{ x: px, y: py }];
    visited[py][px] = true;
    let reachable = [];

    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];

    while (queue.length > 0) {
        let {x, y} = queue.shift();
        if (m[y][x] === 0) reachable.push({x, y});

        for (let [dx, dy] of dirs) {
            let nx = x + dx, ny = y + dy;
            if (ny < 0 || ny >= m.length || nx < 0 || nx >= m[0].length) continue;
            if (!visited[ny][nx] && m[ny][nx] !== 1) {
                visited[ny][nx] = true;
                queue.push({x: nx, y: ny});
            }
        }
    }

    return reachable;
}

// SPAWN ENEMIES
function spawnEnemies(count) {
    let freeTiles = [];
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            if (maze[y][x] === 0) freeTiles.push({ x, y });
        }
    }
    for (let i = 0; i < count; i++) {
        if (freeTiles.length === 0) break;
        let r = Math.floor(Math.random() * freeTiles.length);
        let pos = freeTiles.splice(r, 1)[0];
        maze[pos.y][pos.x] = 3;
    }
}

//  SPAWN POWER-UP 
function spawnPowerUp() {
    let freeTiles = [];
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            if (maze[y][x] === 0) freeTiles.push({ x, y });
        }
    }
    if (freeTiles.length === 0) return;
    let r = Math.floor(Math.random() * freeTiles.length);
    let pos = freeTiles[r];
    maze[pos.y][pos.x] = 5;
}

// HELPERS 
function isInside(x, y) { return y >= 0 && y < maze.length && x >= 0 && x < maze[0].length; }
function findPlayer() { for (let y = 0; y < maze.length; y++) for (let x = 0; x < maze[y].length; x++) if (maze[y][x] === 2) return { x, y }; }

// ================= BUILD MAZE =================
function buildMaze() {
    main.innerHTML = "";
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            let block = document.createElement("div");
            block.classList.add("block");
            switch (maze[y][x]) {
                case 0:
                    block.classList.add("point");
                    block.style.backgroundColor = "white";
                    block.style.height = "1vh";
                    block.style.width = "1vh";
                    break;
                case 1: block.classList.add("wall"); break;
                case 2:
                    block.id = "player";
                    let mouth = document.createElement("div");
                    block.appendChild(mouth);
                    block.style.backgroundColor = playerColor;
                    break;
                case 3: block.classList.add("enemy"); break;
                case 4: block.style.backgroundColor = "black"; break;
                case 5:
                    block.classList.add("powerup");
                    block.style.backgroundColor = "yellow";
                    break;
            }
            main.appendChild(block);
        }
    }
}

// ================= LIVES =================
function renderLives() {
    livesContainer.innerHTML = "";
    for (let i = 0; i < lives; i++) livesContainer.appendChild(document.createElement("li"));
}

// ================= START GAME =================
startDiv.addEventListener("click", () => {
    playerColor = prompt("Choose player color (yellow/red/blue):", "yellow") || "yellow";
    startDiv.classList.add("hidden");
    gameStarted = true; gameOver = false;
    score = 0; level = 1; direction = null;
    scoreDisplay.textContent = score;
    renderLives();
    setupLevel();
});

// ================= PLAYER MOVE =================
function movePlayer() {
    if (!direction || !gameStarted || gameOver) return;
    let pos = findPlayer();
    let nx = pos.x + direction.dx, ny = pos.y + direction.dy;
    if (!isInside(nx, ny) || maze[ny][nx] === 1) return;
    if (maze[ny][nx] === 3) { loseLife(); return; }

    if (maze[ny][nx] === 0) score += 10;
    if (maze[ny][nx] === 5) { score += 50; playerSpeed = 80; setTimeout(() => playerSpeed = 180, 5000); }

    scoreDisplay.textContent = score;
    maze[pos.y][pos.x] = 4;
    maze[ny][nx] = 2;
    buildMaze();

    let mouth = document.querySelector("#player div");
    if (mouth) mouth.className = direction.className;

    checkWin();
}

// ================= ENEMY MOVE =================
function moveEnemies() {
    if (!gameStarted || gameOver) return;
    let enemies = [];
    for (let y = 0; y < maze.length; y++)
        for (let x = 0; x < maze[y].length; x++)
            if (maze[y][x] === 3) enemies.push({ x, y });

    for (let e of enemies) {
        let dirs = [[1,0],[-1,0],[0,1],[0,-1]];
        let r = dirs[Math.floor(Math.random()*4)];
        let nx = e.x+r[0], ny = e.y+r[1];
        if (!isInside(nx, ny)) continue;
        if (maze[ny][nx] === 2) { loseLife(); continue; }
        if (maze[ny][nx] !== 1 && maze[ny][nx] !== 3) { maze[e.y][e.x] = 4; maze[ny][nx] = 3; }
    }
    buildMaze();
}

// ================= GAME LOOP =================
setInterval(movePlayer, playerSpeed);
setInterval(moveEnemies, enemySpeed - level*30);

// ================= INPUT =================
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") direction = { dx:0, dy:-1, className:"up" };
    if (e.key === "ArrowDown") direction = { dx:0, dy:1, className:"down" };
    if (e.key === "ArrowLeft") direction = { dx:-1, dy:0, className:"left" };
    if (e.key === "ArrowRight") direction = { dx:1, dy:0, className:"right" };
});

// ================= LIFE =================
function loseLife() {
    if (invincible) return;
    invincible = true;
    lives--; renderLives();
    setTimeout(() => invincible = false, 1500);
    if (lives <= 0) endGame();
}

// ================= LEVEL CHECK =================
function checkWin() {
    for (let row of maze) if (row.includes(0)) return;
    level++;
    alert("LEVEL " + level);
    setupLevel();
}

// ================= END GAME =================
function endGame() {
    gameOver = true;
    let name = prompt("Game Over! Enter Name:");
    if (name) {
        saveScore(name, score);
        loadLeaderboard(); // <-- refresh leaderboard immediately
    }
    location.reload();
}

// ================= LEADERBOARD =================
function saveScore(name, score) {
    let scores = JSON.parse(localStorage.getItem("scores")) || [];
    scores.push({ name, score });
    scores.sort((a,b)=>b.score - a.score);
    scores = scores.slice(0,5);
    localStorage.setItem("scores", JSON.stringify(scores));
}

function loadLeaderboard() {
    let scores = JSON.parse(localStorage.getItem("scores")) || [];
    leaderboard.innerHTML = "";
    for (let s of scores) {
        let li = document.createElement("li");
        li.textContent = s.name + " .... " + s.score;
        leaderboard.appendChild(li);
    }
}
loadLeaderboard();


