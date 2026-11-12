(() => {
  const LEVEL_WIDTH = 1480;
  const platforms = [
    { x: 150, y: 355, w: 190 }, { x: 410, y: 300, w: 190 },
    { x: 690, y: 350, w: 190 }, { x: 965, y: 275, w: 210 },
    { x: 1220, y: 345, w: 180 }
  ];

  window.Arcade.register('jumpman', ({ ctx, W, H, showMessage }) => {
    let game;
    function reset() {
      game = {
        x: 48, y: 390, vx: 0, vy: 0, grounded: false, camera: 0, score: 0, lives: 3, elapsed: 0, over: false,
        coins: [{ x: 205, y: 318 }, { x: 465, y: 263 }, { x: 748, y: 313 }, { x: 1035, y: 238 }, { x: 1280, y: 308 }],
        enemies: [{ x: 515, y: 420, min: 455, max: 565, vx: 58 }, { x: 820, y: 420, min: 735, max: 850, vx: -66 }, { x: 1090, y: 420, min: 990, max: 1140, vx: 72 }]
      };
    }
    function keydown(key, event, wasDown) {
      if (!game.over && ['arrowup', ' ', 'w'].includes(key) && !wasDown) game.jumpQueued = true;
    }
    function update(dt, keys) {
      const g = game;
      if (g.over) return;
      g.elapsed += dt;
      const speed = 235;
      g.vx = 0;
      if (keys.has('arrowleft') || keys.has('a')) g.vx = -speed;
      if (keys.has('arrowright') || keys.has('d')) g.vx = speed;
      if (g.jumpQueued && g.grounded) { g.vy = -480; g.grounded = false; }
      g.jumpQueued = false;
      const oldBottom = g.y + 32;
      g.x = Math.max(0, Math.min(LEVEL_WIDTH - 26, g.x + g.vx * dt));
      g.vy = Math.min(650, g.vy + 1250 * dt);
      g.y += g.vy * dt;
      g.grounded = false;
      if (g.y + 32 >= 440) { g.y = 408; g.vy = 0; g.grounded = true; }
      if (g.vy >= 0) for (const p of platforms) {
        if (g.x + 26 > p.x && g.x < p.x + p.w && oldBottom <= p.y + 3 && g.y + 32 >= p.y) {
          g.y = p.y - 32; g.vy = 0; g.grounded = true;
        }
      }
      g.coins = g.coins.filter((coin) => {
        if (Math.hypot(g.x + 13 - coin.x, g.y + 16 - coin.y) < 27) { g.score += 100; return false; }
        return true;
      });
      for (const enemy of g.enemies) {
        if (enemy.x < 0) continue;
        enemy.x += enemy.vx * dt;
        if (enemy.x < enemy.min || enemy.x > enemy.max) enemy.vx *= -1;
        if (Math.abs(g.x + 13 - enemy.x) < 23 && Math.abs(g.y + 16 - enemy.y) < 28) {
          if (g.vy > 100 && g.y + 32 < enemy.y + 15) { enemy.x = -100; g.vy = -300; g.score += 150; }
          else {
            g.lives--;
            if (g.lives <= 0) { g.over = true; showMessage(`GAME OVER — score ${g.score}. Press Restart to try again.`); }
            else { g.x = Math.max(0, g.x - 75); g.y = 408; g.vy = 0; }
            break;
          }
        }
      }
      g.camera = Math.max(0, Math.min(LEVEL_WIDTH - W, g.x - W * 0.36));
      if (g.x + 26 >= 1380 && g.coins.length === 0) { g.over = true; showMessage(`LEVEL CLEAR! — score ${g.score}`); }
    }
    function draw() {
      const g = game, camera = g.camera;
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#18284d'); sky.addColorStop(1, '#34466b');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#273b58';
      for (let x = -((camera * 0.2) % 260) - 80; x < W + 260; x += 260) { ctx.beginPath(); ctx.ellipse(x + 110, 430, 155, 110, 0, Math.PI, 0); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,.8)';
      for (let x = 70 - ((camera * 0.12) % 470); x < W + 100; x += 470) { ctx.beginPath(); ctx.arc(x, 90, 18, 0, Math.PI * 2); ctx.arc(x + 22, 82, 25, 0, Math.PI * 2); ctx.arc(x + 49, 92, 17, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#4d302c'; ctx.fillRect(0, 440, W, 40);
      ctx.fillStyle = '#70c65a'; ctx.fillRect(0, 440, W, 9); ctx.fillStyle = '#3e9b55'; ctx.fillRect(0, 449, W, 5);
      for (let x = -(camera % 40); x < W; x += 40) { ctx.strokeStyle = 'rgba(255,220,150,.12)'; ctx.strokeRect(x, 460, 40, 20); }
      for (const p of platforms) {
        const x = p.x - camera;
        if (x + p.w < -10 || x > W + 10) continue;
        ctx.fillStyle = '#a85e3b'; ctx.fillRect(x, p.y, p.w, 20); ctx.fillStyle = '#e69a54'; ctx.fillRect(x, p.y, p.w, 5);
        ctx.strokeStyle = '#6e3d39'; ctx.lineWidth = 2;
        for (let bx = 0; bx < p.w; bx += 32) { ctx.strokeRect(x + bx, p.y + 5, 32, 15); if ((bx / 32) % 2 === 0) { ctx.beginPath(); ctx.moveTo(x + bx + 16, p.y + 5); ctx.lineTo(x + bx + 16, p.y + 20); ctx.stroke(); } }
      }
      for (const coin of g.coins) {
        ctx.save(); ctx.translate(coin.x - camera, coin.y); ctx.rotate(g.elapsed * 2.3); ctx.fillStyle = '#ffd44f'; ctx.strokeStyle = '#fff0a1'; ctx.lineWidth = 2; ctx.beginPath();
        for (let i = 0; i < 10; i++) { const r = i % 2 ? 6 : 13, a = -Math.PI / 2 + i * Math.PI / 5; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      }
      for (const enemy of g.enemies) {
        const x = enemy.x - camera; if (enemy.x < 0 || x < -30 || x > W + 30) continue;
        ctx.fillStyle = '#a54c3d'; ctx.beginPath(); ctx.ellipse(x, enemy.y, 15, 13, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#f6e8d2'; ctx.fillRect(x - 9, enemy.y - 7, 5, 7); ctx.fillRect(x + 4, enemy.y - 7, 5, 7);
        ctx.fillStyle = '#252333'; ctx.fillRect(x - 7, enemy.y - 5, 2, 4); ctx.fillRect(x + 5, enemy.y - 5, 2, 4);
        ctx.fillStyle = '#52352e'; ctx.fillRect(x - 13, enemy.y + 8, 10, 5); ctx.fillRect(x + 3, enemy.y + 8, 10, 5);
      }
      const flagX = 1380 - camera;
      ctx.fillStyle = '#f7f0dc'; ctx.fillRect(flagX, 300, 5, 140); ctx.fillStyle = '#5be09a'; ctx.beginPath(); ctx.moveTo(flagX + 5, 304); ctx.lineTo(flagX + 49, 318); ctx.lineTo(flagX + 5, 334); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f5d774'; ctx.beginPath(); ctx.ellipse(flagX + 2, 440, 16, 5, 0, 0, Math.PI * 2); ctx.fill();
      const px = Math.round(g.x - camera), py = Math.round(g.y);
      ctx.fillStyle = '#d94252'; ctx.fillRect(px + 4, py, 18, 7); ctx.fillRect(px, py + 6, 25, 5);
      ctx.fillStyle = '#f3bd83'; ctx.fillRect(px + 5, py + 11, 16, 10); ctx.fillRect(px + 18, py + 15, 7, 5);
      ctx.fillStyle = '#29243b'; ctx.fillRect(px + 16, py + 14, 3, 3); ctx.fillRect(px + 3, py + 19, 20, 7);
      ctx.fillStyle = '#3979d4'; ctx.fillRect(px + 2, py + 24, 22, 7); ctx.fillRect(px + 5, py + 21, 6, 9); ctx.fillRect(px + 16, py + 21, 6, 9);
      ctx.fillStyle = '#392d3c'; ctx.fillRect(px, py + 30, 11, 4); ctx.fillRect(px + 16, py + 30, 11, 4);
      ctx.fillStyle = '#f8f7ff'; ctx.font = 'bold 15px monospace'; ctx.textAlign = 'left'; ctx.fillText(`STARS ${5 - g.coins.length}/5`, 20, 28);
      ctx.textAlign = 'right'; ctx.fillText(`SCORE ${String(g.score).padStart(4, '0')}   LIVES ${'♥ '.repeat(g.lives).trim()}`, W - 20, 28);
      ctx.fillStyle = 'rgba(255,255,255,.72)'; ctx.font = '11px monospace'; ctx.textAlign = 'center';
      if (g.coins.length) ctx.fillText('COLLECT EVERY STAR TO UNLOCK THE FLAG', W / 2, H - 15);
    }
    return { title: 'Jumpman', kicker: 'JUMP, COLLECT, REACH THE FLAG', instructions: 'Move with <kbd>←</kbd> / <kbd>→</kbd> or <kbd>A</kbd> / <kbd>D</kbd>; jump with <kbd>Space</kbd>, <kbd>↑</kbd>, or <kbd>W</kbd>. Collect every star and reach the flag!', touchControls: false, start: reset, update(dt, keys) { update(dt, keys); }, draw, keydown };
  });
})();
