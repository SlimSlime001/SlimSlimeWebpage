(() => {
  const picker = document.getElementById('game-picker');
  const gameView = document.getElementById('game-view');
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const title = document.getElementById('game-title');
  const kicker = document.getElementById('game-kicker');
  const instructions = document.getElementById('game-instructions');
  const message = document.getElementById('canvas-message');
  const touchControls = document.getElementById('touch-controls');
  let activeGame = null;
  let animationFrame = 0;
  let lastTime = 0;
  let gameState;
  const keys = new Set();
  const W = canvas.width;
  const H = canvas.height;

  function stopGame() {
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    activeGame = null;
    keys.clear();
  }

  function showMessage(text) {
    message.textContent = text;
    message.hidden = false;
  }

  function hideMessage() {
    message.hidden = true;
  }

  function chooseGame(name) {
    stopGame();
    picker.hidden = true;
    gameView.hidden = false;
    activeGame = name;
    lastTime = 0;
    hideMessage();
    if (name === 'pong') {
      title.textContent = 'Pong';
      kicker.textContent = 'THE ORIGINAL ARCADE DUEL';
      instructions.innerHTML = 'Move your paddle with <kbd>W</kbd> / <kbd>S</kbd> or <kbd>↑</kbd> / <kbd>↓</kbd>. First to 7 wins.';
      touchControls.hidden = false;
      resetPong();
    } else {
      title.textContent = 'Pac-Man';
      kicker.textContent = 'READY, SET, CHOMP';
      instructions.innerHTML = 'Use the <kbd>Arrow keys</kbd> or <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> to explore the maze.';
      touchControls.hidden = true;
      resetPacman();
    }
    canvas.focus();
    animationFrame = requestAnimationFrame(loop);
  }

  document.querySelectorAll('[data-game]').forEach((button) => {
    button.addEventListener('click', () => chooseGame(button.dataset.game));
  });

  document.getElementById('back-button').addEventListener('click', () => {
    stopGame();
    gameView.hidden = true;
    picker.hidden = false;
    ctx.clearRect(0, 0, W, H);
    hideMessage();
  });

  document.getElementById('restart-button').addEventListener('click', () => {
    if (activeGame) chooseGame(activeGame);
  });

  document.addEventListener('keydown', (event) => {
    const validKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'];
    if (validKeys.includes(event.key)) event.preventDefault();
    keys.add(event.key.toLowerCase());
  });
  document.addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));
  window.addEventListener('blur', () => keys.clear());
  document.querySelectorAll('[data-control]').forEach((button) => {
    const key = button.dataset.control === 'up' ? 'arrowup' : 'arrowdown';
    const release = () => keys.delete(key);
    button.addEventListener('pointerdown', (event) => { event.preventDefault(); keys.add(key); });
    button.addEventListener('pointerup', release);
    button.addEventListener('pointerleave', release);
    button.addEventListener('pointercancel', release);
  });

  function loop(timestamp) {
    if (!activeGame) return;
    const dt = Math.min((timestamp - (lastTime || timestamp)) / 1000, 0.04);
    lastTime = timestamp;
    if (activeGame === 'pong') updatePong(dt);
    else updatePacman(dt);
    animationFrame = requestAnimationFrame(loop);
  }

  // Pong
  function resetPong() {
    gameState = { leftY: H / 2 - 54, rightY: H / 2 - 54, ballX: W / 2, ballY: H / 2, vx: 300, vy: 150, leftScore: 0, rightScore: 0, over: false };
    drawPong();
  }

  function updatePong(dt) {
    const g = gameState;
    if (g.over) return;
    const speed = 390;
    if (keys.has('w') || keys.has('arrowup')) g.leftY -= speed * dt;
    if (keys.has('s') || keys.has('arrowdown')) g.leftY += speed * dt;
    g.leftY = clamp(g.leftY, 20, H - 128);
    g.ballX += g.vx * dt;
    g.ballY += g.vy * dt;
    if (g.ballY < 18 || g.ballY > H - 18) g.vy *= -1;
    const paddleH = 108;
    if (g.vx < 0 && g.ballX - 12 < 38 && g.ballX > 25 && g.ballY > g.leftY && g.ballY < g.leftY + paddleH) {
      g.vx = Math.abs(g.vx) * 1.06;
      g.vy += ((g.ballY - (g.leftY + paddleH / 2)) / (paddleH / 2)) * 100;
    }
    if (g.vx > 0 && g.ballX + 12 > W - 38 && g.ballX < W - 25 && g.ballY > g.rightY && g.ballY < g.rightY + paddleH) {
      g.vx = -Math.abs(g.vx) * 1.04;
      g.vy += ((g.ballY - (g.rightY + paddleH / 2)) / (paddleH / 2)) * 100;
    }
    // A compact CPU opponent tracks the ball, with a little room for error.
    const target = g.ballY - paddleH / 2;
    g.rightY += clamp(target - g.rightY, -275 * dt, 275 * dt);
    g.rightY = clamp(g.rightY, 20, H - 128);
    if (g.ballX < 0) { g.rightScore++; servePong(-1); }
    if (g.ballX > W) { g.leftScore++; servePong(1); }
    if (g.leftScore >= 7 || g.rightScore >= 7) {
      g.over = true;
      showMessage(g.leftScore >= 7 ? 'YOU WIN! — press Restart to play again' : 'CPU WINS — press Restart for a rematch');
    }
    drawPong();
  }

  function servePong(direction) {
    const g = gameState;
    g.ballX = W / 2;
    g.ballY = H / 2;
    g.vx = 300 * direction;
    g.vy = (Math.random() * 200) - 100;
  }

  function drawPong() {
    const g = gameState;
    ctx.fillStyle = '#10121d'; ctx.fillRect(0, 0, W, H);
    ctx.setLineDash([12, 14]); ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(W / 2, 20); ctx.lineTo(W / 2, H - 20); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#9b8cff'; ctx.fillRect(25, g.leftY, 13, 108);
    ctx.fillStyle = '#f6c95d'; ctx.fillRect(W - 38, g.rightY, 13, 108);
    ctx.fillStyle = '#f8f7ff'; ctx.beginPath(); ctx.arc(g.ballX, g.ballY, 11, 0, Math.PI * 2); ctx.fill();
    ctx.font = '700 44px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,.78)';
    ctx.fillText(String(g.leftScore).padStart(2, '0'), W / 2 - 65, 75); ctx.fillText(String(g.rightScore).padStart(2, '0'), W / 2 + 65, 75);
    ctx.font = '12px monospace'; ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillText('YOU', 32, H - 22); ctx.fillText('CPU', W - 32, H - 22);
  }

  // Pac-Man: a generated, tile-based maze with collectible dots and roaming ghosts.
  const TILE = 24;
  const COLS = 19;
  const ROWS = 15;
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

  function buildMaze() {
    const maze = Array.from({ length: ROWS }, (_, y) => Array.from({ length: COLS }, (_, x) => (x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1) ? '#' : '.'));
    // Symmetric wall segments leave plenty of routes through the maze.
    for (const y of [3, 7, 11]) {
      for (let x = 2; x < COLS - 2; x++) if (x % 6 !== 3) maze[y][x] = '#';
    }
    for (const x of [4, 9, 14]) {
      for (let y = 2; y < ROWS - 2; y++) if (y % 4 !== 0) maze[y][x] = '#';
    }
    // Keep the starting area and ghost den connected and clear.
    for (let x = 1; x <= 3; x++) maze[1][x] = '.';
    maze[1][1] = ' ';
    for (let y = 6; y <= 8; y++) for (let x = 8; x <= 10; x++) maze[y][x] = ' ';
    maze[7][9] = ' ';
    maze[13][17] = '.';
    maze[1][17] = '.';
    maze[13][1] = '.';
    maze[13][17] = '.';
    return maze;
  }

  function resetPacman() {
    const maze = buildMaze();
    let dots = 0;
    maze.forEach((row) => row.forEach((cell) => { if (cell === '.') dots++; }));
    gameState = {
      maze, dots, score: 0, lives: 3, pac: { x: 1, y: 1, dir: 'right', next: 'right' },
      ghosts: [{ x: 9, y: 7, color: '#ff6685' }, { x: 8, y: 7, color: '#49d9ec' }, { x: 10, y: 7, color: '#f2a6ff' }],
      elapsed: 0, over: false, won: false
    };
    hideMessage(); drawPacman();
  }

  function updatePacman(dt) {
    const g = gameState;
    if (g.over) return;
    g.elapsed += dt;
    if (g.elapsed < 0.13) return;
    g.elapsed = 0;
    const pac = g.pac;
    const wanted = DIRS[pac.next];
    if (canMove(pac.x + wanted[0], pac.y + wanted[1], g.maze)) pac.dir = pac.next;
    const direction = DIRS[pac.dir];
    if (canMove(pac.x + direction[0], pac.y + direction[1], g.maze)) {
      pac.x += direction[0]; pac.y += direction[1];
    }
    if (g.maze[pac.y][pac.x] === '.') { g.maze[pac.y][pac.x] = ' '; g.score += 10; g.dots--; }
    g.ghosts.forEach((ghost) => {
      const moves = Object.entries(DIRS).filter(([, d]) => canMove(ghost.x + d[0], ghost.y + d[1], g.maze));
      if (!moves.length) return;
      // Ghosts usually continue, but occasionally choose a new valid direction.
      const choice = moves.find(([, d]) => ghost.x + d[0] !== pac.x || ghost.y + d[1] !== pac.y) || moves[0];
      const [name, d] = Math.random() < 0.52 ? moves[Math.floor(Math.random() * moves.length)] : choice;
      ghost.x += d[0]; ghost.y += d[1]; ghost.dir = name;
    });
    const caught = g.ghosts.some((ghost) => ghost.x === pac.x && ghost.y === pac.y);
    if (caught) {
      g.lives--;
      if (g.lives <= 0) { g.over = true; showMessage(`GAME OVER — final score ${g.score}`); }
      else {
        pac.x = 1; pac.y = 1; pac.dir = 'right'; pac.next = 'right';
        g.ghosts = [{ x: 9, y: 7, color: '#ff6685' }, { x: 8, y: 7, color: '#49d9ec' }, { x: 10, y: 7, color: '#f2a6ff' }];
      }
    }
    if (g.dots === 0) { g.over = true; g.won = true; showMessage(`MAZE CLEARED! — score ${g.score}`); }
    drawPacman();
  }

  function canMove(x, y, maze) { return y >= 0 && y < ROWS && x >= 0 && x < COLS && maze[y][x] !== '#'; }

  function drawPacman() {
    const g = gameState;
    ctx.fillStyle = '#10121d'; ctx.fillRect(0, 0, W, H);
    const offsetX = (W - COLS * TILE) / 2;
    const offsetY = 40;
    g.maze.forEach((row, y) => row.forEach((cell, x) => {
      const px = offsetX + x * TILE, py = offsetY + y * TILE;
      if (cell === '#') {
        ctx.fillStyle = '#282b70'; ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
        ctx.strokeStyle = '#6864dc'; ctx.lineWidth = 1; ctx.strokeRect(px + 3, py + 3, TILE - 6, TILE - 6);
      } else if (cell === '.') {
        ctx.fillStyle = '#f5e8b0'; ctx.beginPath(); ctx.arc(px + TILE / 2, py + TILE / 2, 2.4, 0, Math.PI * 2); ctx.fill();
      }
    }));
    ctx.fillStyle = '#f8f7ff'; ctx.font = 'bold 15px monospace'; ctx.textAlign = 'left';
    ctx.fillText(`SCORE  ${String(g.score).padStart(4, '0')}`, offsetX, 25);
    ctx.textAlign = 'right'; ctx.fillText(`LIVES  ${'♥ '.repeat(g.lives).trim()}`, offsetX + COLS * TILE, 25);
    g.ghosts.forEach((ghost) => {
      const x = offsetX + ghost.x * TILE + TILE / 2, y = offsetY + ghost.y * TILE + TILE / 2;
      ctx.fillStyle = ghost.color; ctx.beginPath(); ctx.arc(x, y, 9, Math.PI, 0); ctx.lineTo(x + 9, y + 8); ctx.lineTo(x + 4, y + 5); ctx.lineTo(x, y + 8); ctx.lineTo(x - 4, y + 5); ctx.lineTo(x - 9, y + 8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - 3, y - 1, 2.5, 0, Math.PI * 2); ctx.arc(x + 3, y - 1, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#25294e'; ctx.beginPath(); ctx.arc(x - 3, y, 1, 0, Math.PI * 2); ctx.arc(x + 3, y, 1, 0, Math.PI * 2); ctx.fill();
    });
    const pac = g.pac;
    const px = offsetX + pac.x * TILE + TILE / 2, py = offsetY + pac.y * TILE + TILE / 2;
    const angles = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
    ctx.fillStyle = '#ffd44f'; ctx.beginPath(); ctx.moveTo(px, py); ctx.arc(px, py, 10, angles[pac.dir] + 0.25, angles[pac.dir] + Math.PI * 2 - 0.25); ctx.closePath(); ctx.fill();
  }

  document.addEventListener('keydown', (event) => {
    if (!activeGame || activeGame !== 'pacman' || !gameState || gameState.over) return;
    const map = { arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down', arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right' };
    if (map[event.key.toLowerCase()]) gameState.pac.next = map[event.key.toLowerCase()];
  });

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
})();
