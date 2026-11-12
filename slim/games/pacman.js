(() => {
  const TILE = 24, COLS = 19, ROWS = 15;
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

  window.Arcade.register('pacman', ({ ctx, W, H, showMessage }) => {
    let game;
    function buildMaze() {
      const maze = Array.from({ length: ROWS }, (_, y) => Array.from({ length: COLS }, (_, x) => (x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1) ? '#' : '.'));
      for (const y of [3, 7, 11]) for (let x = 2; x < COLS - 2; x++) if (x % 6 !== 3) maze[y][x] = '#';
      for (const x of [4, 9, 14]) for (let y = 2; y < ROWS - 2; y++) if (y % 4 !== 0) maze[y][x] = '#';
      for (let x = 1; x <= 3; x++) maze[1][x] = '.';
      maze[1][1] = ' ';
      for (let y = 6; y <= 8; y++) for (let x = 8; x <= 10; x++) maze[y][x] = ' ';
      maze[7][9] = ' ';
      maze[13][17] = '.'; maze[1][17] = '.'; maze[13][1] = '.';
      return maze;
    }
    function reset() {
      const maze = buildMaze();
      let dots = 0;
      maze.forEach((row) => row.forEach((cell) => { if (cell === '.') dots++; }));
      game = { maze, dots, score: 0, lives: 3, pac: { x: 1, y: 1, dir: 'right', next: 'right' }, ghosts: makeGhosts(), elapsed: 0, over: false };
    }
    function makeGhosts() {
      return [{ x: 9, y: 7, color: '#ff6685' }, { x: 8, y: 7, color: '#49d9ec' }, { x: 10, y: 7, color: '#f2a6ff' }];
    }
    function canMove(x, y) { return y >= 0 && y < ROWS && x >= 0 && x < COLS && game.maze[y][x] !== '#'; }
    function keydown(key) {
      if (game.over) return;
      const map = { arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down', arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right' };
      if (map[key]) game.pac.next = map[key];
    }
    function update(dt) {
      const g = game;
      if (g.over) return;
      g.elapsed += dt;
      if (g.elapsed < 0.13) return;
      g.elapsed = 0;
      const pac = g.pac, wanted = DIRS[pac.next];
      if (canMove(pac.x + wanted[0], pac.y + wanted[1])) pac.dir = pac.next;
      const direction = DIRS[pac.dir];
      if (canMove(pac.x + direction[0], pac.y + direction[1])) { pac.x += direction[0]; pac.y += direction[1]; }
      if (g.maze[pac.y][pac.x] === '.') { g.maze[pac.y][pac.x] = ' '; g.score += 10; g.dots--; }
      g.ghosts.forEach((ghost) => {
        const moves = Object.entries(DIRS).filter(([, d]) => canMove(ghost.x + d[0], ghost.y + d[1]));
        if (!moves.length) return;
        const choice = moves.find(([, d]) => ghost.x + d[0] !== pac.x || ghost.y + d[1] !== pac.y) || moves[0];
        const [, d] = Math.random() < 0.52 ? moves[Math.floor(Math.random() * moves.length)] : choice;
        ghost.x += d[0]; ghost.y += d[1];
      });
      if (g.ghosts.some((ghost) => ghost.x === pac.x && ghost.y === pac.y)) {
        g.lives--;
        if (g.lives <= 0) { g.over = true; showMessage(`GAME OVER — final score ${g.score}`); }
        else { pac.x = 1; pac.y = 1; pac.dir = 'right'; pac.next = 'right'; g.ghosts = makeGhosts(); }
      }
      if (g.dots === 0) { g.over = true; showMessage(`MAZE CLEARED! — score ${g.score}`); }
    }
    function draw() {
      const g = game;
      ctx.fillStyle = '#10121d'; ctx.fillRect(0, 0, W, H);
      const offsetX = (W - COLS * TILE) / 2, offsetY = 40;
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
      const pac = g.pac, px = offsetX + pac.x * TILE + TILE / 2, py = offsetY + pac.y * TILE + TILE / 2;
      const angles = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
      ctx.fillStyle = '#ffd44f'; ctx.beginPath(); ctx.moveTo(px, py); ctx.arc(px, py, 10, angles[pac.dir] + 0.25, angles[pac.dir] + Math.PI * 2 - 0.25); ctx.closePath(); ctx.fill();
    }
    return { title: 'Pac-Man', kicker: 'READY, SET, CHOMP', instructions: 'Use the <kbd>Arrow keys</kbd> or <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> to explore the maze.', touchControls: false, start: reset, update, draw, keydown };
  });
})();
