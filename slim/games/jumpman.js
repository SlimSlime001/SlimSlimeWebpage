(() => {
  const LEVELS = [
    {
      name: 'Sunny Start', sky: ['#78c9f5', '#d2f3ff'], hills: '#7acb72', ground: '#64bd55',
      platforms: [[150, 355, 190], [410, 300, 190], [690, 350, 190], [965, 275, 210], [1220, 345, 180]],
      enemies: [[515, 455, 565, 58], [820, 735, 850, -66], [1090, 990, 1140, 72]]
    },
    {
      name: 'Mushroom Meadow', sky: ['#8bd6ef', '#e3f7c4'], hills: '#52b879', ground: '#4ca85c',
      platforms: [[130, 330, 185], [375, 275, 180], [625, 345, 190], [890, 290, 190], [1155, 335, 210]],
      enemies: [[450, 405, 545, -65], [790, 675, 835, 75], [1050, 955, 1115, -70]]
    },
    {
      name: 'Blue Sky Bridge', sky: ['#607ed2', '#b9d6ff'], hills: '#6177b5', ground: '#8972c9',
      platforms: [[155, 300, 185], [400, 355, 180], [650, 290, 190], [915, 345, 185], [1170, 285, 205]],
      enemies: [[500, 445, 560, 70], [795, 710, 855, -75], [1080, 1000, 1135, 78]]
    },
    {
      name: 'Peachy Peaks', sky: ['#f69eb5', '#ffe2b7'], hills: '#d887a4', ground: '#ba7159',
      platforms: [[120, 350, 180], [365, 285, 175], [610, 335, 190], [880, 270, 195], [1150, 325, 210]],
      enemies: [[455, 405, 535, 75], [785, 680, 850, -80], [1060, 970, 1135, 70]]
    },
    {
      name: 'Star Summit', sky: ['#343b80', '#a16dc2'], hills: '#56569a', ground: '#5554a5',
      platforms: [[135, 305, 185], [390, 345, 180], [640, 275, 190], [910, 325, 190], [1180, 250, 195]],
      enemies: [[470, 420, 550, -80], [800, 700, 865, 82], [1080, 990, 1145, -76]]
    }
  ];
  const LEVEL_WIDTH = 1480;
  const GROUND_Y = 440;
  const PLAYER_W = 26;
  const PLAYER_H = 34;
  const PROGRESS_KEY = 'pixelArcadeJumpmanUnlocked';

  window.Arcade.register('jumpman', ({ ctx, W, H, keys, showMessage, hideMessage }) => {
    let mode = 'title';
    let selectedLevel = 0;
    let game;
    let unlocked = loadProgress();

    function loadProgress() {
      try {
        return Math.max(1, Math.min(LEVELS.length, Number(localStorage.getItem(PROGRESS_KEY)) || 1));
      } catch (_) {
        return 1;
      }
    }

    function saveProgress() {
      try { localStorage.setItem(PROGRESS_KEY, String(unlocked)); } catch (_) { /* Progress still works for this visit. */ }
    }

    function start() {
      mode = 'title';
      selectedLevel = Math.min(selectedLevel, unlocked - 1);
      hideMessage();
      draw();
    }

    function beginLevel(index) {
      selectedLevel = index;
      const level = LEVELS[index];
      const platforms = level.platforms.map(([x, y, w]) => ({ x, y, w }));
      game = {
        level, platforms, x: 45, y: GROUND_Y - PLAYER_H, vx: 0, vy: 0,
        grounded: true, camera: 0, score: 0, lives: 3, elapsed: 0, over: false,
        jumpQueued: false,
        coins: platforms.map((platform) => ({ x: platform.x + platform.w / 2, y: platform.y - 36 })),
        enemies: level.enemies.map(([x, min, max, vx]) => ({ x, y: GROUND_Y - 20, min, max, vx }))
      };
      mode = 'playing';
      hideMessage();
      draw();
    }

    function showMap() {
      mode = 'map';
      selectedLevel = Math.min(selectedLevel, unlocked - 1);
      hideMessage();
      draw();
    }

    function keydown(key, event, wasDown) {
      if (wasDown) return;
      if (mode === 'title') {
        if (['enter', ' ', 'arrowup', 'w'].includes(key)) showMap();
        return;
      }
      if (mode === 'map') {
        if (['arrowleft', 'a', 'arrowup', 'w'].includes(key)) selectedLevel = (selectedLevel + unlocked - 1) % unlocked;
        if (['arrowright', 'd', 'arrowdown', 's'].includes(key)) selectedLevel = (selectedLevel + 1) % unlocked;
        if (['enter', ' '].includes(key)) beginLevel(selectedLevel);
        draw();
        return;
      }
      if (mode !== 'playing' || game.over) {
        if (mode === 'playing' && ['enter', ' '].includes(key)) showMap();
        return;
      }
      if (['arrowup', ' ', 'w'].includes(key)) game.jumpQueued = true;
    }

    function update(dt, heldKeys) {
      if (mode !== 'playing' || game.over) return;
      const g = game;
      g.elapsed += dt;
      g.vx = 0;
      if (heldKeys.has('arrowleft') || heldKeys.has('a')) g.vx = -235;
      if (heldKeys.has('arrowright') || heldKeys.has('d')) g.vx = 235;
      if (g.jumpQueued && g.grounded) { g.vy = -480; g.grounded = false; }
      g.jumpQueued = false;

      const oldBottom = g.y + PLAYER_H;
      g.x = Math.max(0, Math.min(LEVEL_WIDTH - PLAYER_W, g.x + g.vx * dt));
      g.vy = Math.min(650, g.vy + 1250 * dt);
      g.y += g.vy * dt;
      g.grounded = false;
      if (g.y + PLAYER_H >= GROUND_Y) { g.y = GROUND_Y - PLAYER_H; g.vy = 0; g.grounded = true; }
      if (g.vy >= 0) {
        for (const platform of g.platforms) {
          if (g.x + PLAYER_W > platform.x && g.x < platform.x + platform.w && oldBottom <= platform.y + 3 && g.y + PLAYER_H >= platform.y) {
            g.y = platform.y - PLAYER_H; g.vy = 0; g.grounded = true;
          }
        }
      }

      g.coins = g.coins.filter((coin) => {
        if (Math.hypot(g.x + PLAYER_W / 2 - coin.x, g.y + PLAYER_H / 2 - coin.y) < 27) { g.score += 100; return false; }
        return true;
      });
      for (const enemy of g.enemies) {
        enemy.x += enemy.vx * dt;
        if (enemy.x < enemy.min || enemy.x > enemy.max) enemy.vx *= -1;
        if (Math.abs(g.x + PLAYER_W / 2 - enemy.x) < 23 && Math.abs(g.y + PLAYER_H / 2 - enemy.y) < 28) {
          if (g.vy > 100 && g.y + PLAYER_H < enemy.y + 15) {
            enemy.x = -100; g.vy = -300; g.score += 150;
          } else {
            g.lives--;
            if (g.lives <= 0) { g.over = true; showMessage(`GAME OVER — score ${g.score}. Press Enter to return to the map.`); }
            else { g.x = Math.max(0, g.x - 75); g.y = GROUND_Y - PLAYER_H; g.vy = 0; }
            break;
          }
        }
      }
      g.camera = Math.max(0, Math.min(LEVEL_WIDTH - W, g.x - W * 0.36));
      if (g.x + PLAYER_W >= 1380 && g.coins.length === 0) {
        g.over = true;
        unlocked = Math.max(unlocked, Math.min(LEVELS.length, selectedLevel + 2));
        saveProgress();
        showMessage(`LEVEL ${selectedLevel + 1} CLEAR! — score ${g.score}. Press Enter for the map.`);
      }
    }

    function draw() {
      if (mode === 'title') drawTitle();
      else if (mode === 'map') drawMap();
      else drawLevel();
    }

    function drawBackground(skyColors, hillColor) {
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, skyColors[0]); sky.addColorStop(1, skyColors[1]);
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = hillColor;
      for (let x = -80; x < W + 220; x += 230) {
        ctx.beginPath(); ctx.ellipse(x + 110, 430, 155, 105, 0, Math.PI, 0); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,.72)';
      for (let x = 70; x < W + 100; x += 280) {
        ctx.beginPath(); ctx.arc(x, 90, 16, 0, Math.PI * 2); ctx.arc(x + 22, 82, 23, 0, Math.PI * 2); ctx.arc(x + 49, 92, 15, 0, Math.PI * 2); ctx.fill();
      }
    }

    function drawTitle() {
      drawBackground(['#4d8fd1', '#bbebfa'], '#559e68');
      ctx.fillStyle = '#64bd55'; ctx.fillRect(0, 414, W, 66);
      ctx.fillStyle = '#4d302c'; ctx.fillRect(0, 444, W, 36);
      drawHero(330, 365, 1);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff'; ctx.font = 'bold 22px monospace'; ctx.fillText('SLIMSLIME ARCADE PRESENTS', W / 2, 88);
      ctx.font = '900 76px monospace'; ctx.lineWidth = 8; ctx.strokeStyle = '#9b3d42'; ctx.strokeText('JUMPMAN', W / 2, 190);
      ctx.fillStyle = '#ffe16b'; ctx.fillText('JUMPMAN', W / 2, 190);
      ctx.font = 'bold 18px monospace'; ctx.fillStyle = '#fff'; ctx.fillText('A BRAND-NEW PLATFORM ADVENTURE', W / 2, 232);
      ctx.font = 'bold 16px monospace'; ctx.fillStyle = '#fff';
      ctx.fillText(`5 WORLDS  •  ${unlocked} / ${LEVELS.length} UNLOCKED`, W / 2, 292);
      ctx.fillStyle = '#fff4bd'; ctx.font = 'bold 17px monospace'; ctx.fillText('PRESS ENTER OR SPACE TO START', W / 2, 340);
      ctx.font = '13px monospace'; ctx.fillStyle = 'rgba(255,255,255,.88)'; ctx.fillText('MOVE: ← → / A D     JUMP: SPACE / ↑ / W', W / 2, 385);
    }

    function drawMap() {
      drawBackground(['#69bce7', '#d2f0db'], '#60b46e');
      ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.font = 'bold 25px monospace'; ctx.textAlign = 'center';
      ctx.fillText('WORLD MAP', W / 2, 48);
      ctx.font = '13px monospace'; ctx.fillStyle = '#fff';
      ctx.fillText('CHOOSE A WORLD  •  ← → TO MOVE  •  ENTER TO PLAY', W / 2, 75);

      const nodes = [
        { x: 90, y: 345 }, { x: 220, y: 250 }, { x: 355, y: 330 }, { x: 500, y: 210 }, { x: 635, y: 295 }
      ];
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#fff4bd'; ctx.lineWidth = 24;
      ctx.beginPath(); ctx.moveTo(nodes[0].x, nodes[0].y);
      for (let i = 1; i < nodes.length; i++) {
        const prev = nodes[i - 1], next = nodes[i];
        const midX = (prev.x + next.x) / 2;
        ctx.quadraticCurveTo(midX, prev.y, next.x, next.y);
      }
      ctx.stroke(); ctx.strokeStyle = '#d7a85b'; ctx.lineWidth = 4; ctx.stroke();

      nodes.forEach((node, index) => {
        const isOpen = index < unlocked;
        const isSelected = index === selectedLevel;
        ctx.save();
        if (isSelected) { ctx.beginPath(); ctx.arc(node.x, node.y, 37, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,.48)'; ctx.fill(); }
        ctx.beginPath(); ctx.arc(node.x, node.y, 27, 0, Math.PI * 2);
        ctx.fillStyle = isOpen ? ['#ef6872', '#8fcf63', '#67b9ee', '#ed9b52', '#ae83e8'][index] : '#7b8290';
        ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = isSelected ? '#fff' : 'rgba(255,255,255,.75)'; ctx.stroke();
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 18px monospace'; ctx.fillStyle = '#fff';
        ctx.fillText(isOpen ? String(index + 1) : '×', node.x, node.y + 1);
        ctx.textBaseline = 'alphabetic';
        ctx.font = 'bold 12px monospace'; ctx.fillStyle = '#fff';
        ctx.fillText(isOpen ? LEVELS[index].name : 'LOCKED', node.x, node.y + 52);
        if (isOpen) {
          ctx.fillStyle = '#fff2a1'; ctx.font = '13px sans-serif';
          ctx.fillText('★'.repeat(index < selectedLevel ? 3 : 0), node.x, node.y - 43);
        }
        ctx.restore();
      });
      drawHero(nodes[selectedLevel].x - 12, nodes[selectedLevel].y - 14, 0.65);
      ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = 'bold 14px monospace';
      ctx.fillText(`${unlocked} OF ${LEVELS.length} WORLDS OPEN`, W / 2, 445);
      ctx.font = '12px monospace'; ctx.fillText('COMPLETE A WORLD TO UNLOCK THE NEXT ONE', W / 2, 466);
    }

    function drawLevel() {
      const g = game, level = g.level, camera = g.camera;
      drawBackground(level.sky, level.hills);
      ctx.fillStyle = '#4d302c'; ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
      ctx.fillStyle = level.ground; ctx.fillRect(0, GROUND_Y, W, 9);
      ctx.fillStyle = 'rgba(255,220,150,.15)';
      for (let x = -(camera % 40); x < W; x += 40) ctx.strokeRect(x, 460, 40, 20);
      for (const platform of g.platforms) {
        const x = platform.x - camera;
        if (x + platform.w < -10 || x > W + 10) continue;
        ctx.fillStyle = '#a85e3b'; ctx.fillRect(x, platform.y, platform.w, 20);
        ctx.fillStyle = '#e69a54'; ctx.fillRect(x, platform.y, platform.w, 5);
        ctx.strokeStyle = '#6e3d39'; ctx.lineWidth = 2;
        for (let bx = 0; bx < platform.w; bx += 32) {
          ctx.strokeRect(x + bx, platform.y + 5, 32, 15);
          if ((bx / 32) % 2 === 0) { ctx.beginPath(); ctx.moveTo(x + bx + 16, platform.y + 5); ctx.lineTo(x + bx + 16, platform.y + 20); ctx.stroke(); }
        }
      }
      for (const coin of g.coins) {
        ctx.save(); ctx.translate(coin.x - camera, coin.y); ctx.rotate(g.elapsed * 2.3);
        ctx.fillStyle = '#ffd44f'; ctx.strokeStyle = '#fff0a1'; ctx.lineWidth = 2; ctx.beginPath();
        for (let i = 0; i < 10; i++) { const radius = i % 2 ? 6 : 13, angle = -Math.PI / 2 + i * Math.PI / 5; ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius); }
        ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      }
      for (const enemy of g.enemies) {
        const x = enemy.x - camera;
        if (enemy.x < 0 || x < -30 || x > W + 30) continue;
        ctx.fillStyle = '#a54c3d'; ctx.beginPath(); ctx.ellipse(x, enemy.y, 15, 13, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#f6e8d2'; ctx.fillRect(x - 9, enemy.y - 7, 5, 7); ctx.fillRect(x + 4, enemy.y - 7, 5, 7);
        ctx.fillStyle = '#252333'; ctx.fillRect(x - 7, enemy.y - 5, 2, 4); ctx.fillRect(x + 5, enemy.y - 5, 2, 4);
        ctx.fillStyle = '#52352e'; ctx.fillRect(x - 13, enemy.y + 8, 10, 5); ctx.fillRect(x + 3, enemy.y + 8, 10, 5);
      }
      const flagX = 1380 - camera;
      ctx.fillStyle = '#f7f0dc'; ctx.fillRect(flagX, 300, 5, 140);
      ctx.fillStyle = '#5be09a'; ctx.beginPath(); ctx.moveTo(flagX + 5, 304); ctx.lineTo(flagX + 49, 318); ctx.lineTo(flagX + 5, 334); ctx.closePath(); ctx.fill();
      drawHero(Math.round(g.x - camera), Math.round(g.y), 1);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 15px monospace'; ctx.textAlign = 'left';
      ctx.fillText(`WORLD ${selectedLevel + 1}: ${level.name.toUpperCase()}`, 18, 27);
      ctx.textAlign = 'right'; ctx.fillText(`STARS ${level.platforms.length - g.coins.length}/${level.platforms.length}   SCORE ${String(g.score).padStart(4, '0')}   ♥ ${g.lives}`, W - 18, 27);
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = '11px monospace'; ctx.textAlign = 'center';
      if (g.coins.length) ctx.fillText('COLLECT EVERY STAR TO UNLOCK THE GOAL', W / 2, H - 12);
    }

    function drawHero(x, y, scale) {
      ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
      ctx.fillStyle = '#d94252'; ctx.fillRect(4, 0, 18, 7); ctx.fillRect(0, 6, 25, 5);
      ctx.fillStyle = '#f3bd83'; ctx.fillRect(5, 11, 16, 10); ctx.fillRect(18, 15, 7, 5);
      ctx.fillStyle = '#29243b'; ctx.fillRect(16, 14, 3, 3); ctx.fillRect(3, 19, 20, 7);
      ctx.fillStyle = '#3979d4'; ctx.fillRect(2, 24, 22, 7); ctx.fillRect(5, 21, 6, 9); ctx.fillRect(16, 21, 6, 9);
      ctx.fillStyle = '#392d3c'; ctx.fillRect(0, 30, 11, 4); ctx.fillRect(16, 30, 11, 4);
      ctx.restore();
    }

    return {
      title: 'Jumpman', kicker: 'A FIVE-WORLD PLATFORM ADVENTURE',
      instructions: 'Press <kbd>Enter</kbd> or <kbd>Space</kbd> to start. Move with <kbd>←</kbd> / <kbd>→</kbd> or <kbd>A</kbd> / <kbd>D</kbd>; jump with <kbd>Space</kbd>, <kbd>↑</kbd>, or <kbd>W</kbd>.',
      touchControls: false, start, update, draw, keydown
    };
  });
})();
