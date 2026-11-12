(() => {
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  window.Arcade.register('pong', ({ ctx, W, H, keys, showMessage }) => {
    let game;
    function start() {
      game = { leftY: H / 2 - 54, rightY: H / 2 - 54, ballX: W / 2, ballY: H / 2, vx: 300, vy: 150, leftScore: 0, rightScore: 0, over: false };
    }
    function serve(direction) {
      game.ballX = W / 2; game.ballY = H / 2;
      game.vx = 300 * direction; game.vy = Math.random() * 200 - 100;
    }
    function update(dt) {
      const g = game;
      if (g.over) return;
      const speed = 390;
      if (keys.has('w') || keys.has('arrowup')) g.leftY -= speed * dt;
      if (keys.has('s') || keys.has('arrowdown')) g.leftY += speed * dt;
      g.leftY = clamp(g.leftY, 20, H - 128);
      g.ballX += g.vx * dt; g.ballY += g.vy * dt;
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
      const target = g.ballY - paddleH / 2;
      g.rightY += clamp(target - g.rightY, -275 * dt, 275 * dt);
      g.rightY = clamp(g.rightY, 20, H - 128);
      if (g.ballX < 0) { g.rightScore++; serve(-1); }
      if (g.ballX > W) { g.leftScore++; serve(1); }
      if (g.leftScore >= 7 || g.rightScore >= 7) {
        g.over = true;
        showMessage(g.leftScore >= 7 ? 'YOU WIN! — press Restart to play again' : 'CPU WINS — press Restart for a rematch');
      }
    }
    function draw() {
      const g = game;
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
    return { title: 'Pong', kicker: 'THE ORIGINAL ARCADE DUEL', instructions: 'Move your paddle with <kbd>W</kbd> / <kbd>S</kbd> or <kbd>↑</kbd> / <kbd>↓</kbd>. First to 7 wins.', touchControls: true, start, update, draw };
  });
})();
