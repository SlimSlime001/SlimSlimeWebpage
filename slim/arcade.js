(() => {
  const picker = document.getElementById('game-picker');
  const view = document.getElementById('game-view');
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const title = document.getElementById('game-title');
  const kicker = document.getElementById('game-kicker');
  const instructions = document.getElementById('game-instructions');
  const message = document.getElementById('canvas-message');
  const touchControls = document.getElementById('touch-controls');
  const games = new Map();
  const keys = new Set();
  let activeName = null;
  let activeGame = null;
  let frame = 0;
  let lastTime = 0;
  const W = canvas.width;
  const H = canvas.height;

  function showMessage(text) { message.textContent = text; message.hidden = false; }
  function hideMessage() { message.hidden = true; }

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    if (activeGame && activeGame.stop) activeGame.stop();
    activeGame = null;
    activeName = null;
    keys.clear();
  }

  function start(name) {
    const createGame = games.get(name);
    if (!createGame) return;
    stop();
    picker.hidden = true;
    view.hidden = false;
    activeName = name;
    lastTime = 0;
    hideMessage();
    const config = { ctx, W, H, keys, showMessage, hideMessage };
    activeGame = createGame(config);
    title.textContent = activeGame.title;
    kicker.textContent = activeGame.kicker;
    instructions.innerHTML = activeGame.instructions;
    touchControls.hidden = !activeGame.touchControls;
    if (activeGame.start) activeGame.start();
    canvas.focus();
    frame = requestAnimationFrame(loop);
  }

  function loop(timestamp) {
    if (!activeGame) return;
    const dt = Math.min((timestamp - (lastTime || timestamp)) / 1000, 0.04);
    lastTime = timestamp;
    activeGame.update(dt, keys);
    activeGame.draw();
    frame = requestAnimationFrame(loop);
  }

  document.addEventListener('click', (event) => {
    const card = event.target.closest('[data-game]');
    if (card) start(card.dataset.game);
  });
  document.getElementById('back-button').addEventListener('click', () => {
    stop(); view.hidden = true; picker.hidden = false; ctx.clearRect(0, 0, W, H); hideMessage();
  });
  document.getElementById('restart-button').addEventListener('click', () => { if (activeName) start(activeName); });
  document.addEventListener('keydown', (event) => {
    if (!activeGame) return;
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'w', 'a', 's', 'd'].includes(key)) event.preventDefault();
    const wasDown = keys.has(key);
    keys.add(key);
    if (activeGame.keydown) activeGame.keydown(key, event, wasDown);
  });
  document.addEventListener('keyup', (event) => {
    if (!activeGame) return;
    const key = event.key.toLowerCase();
    keys.delete(key);
    if (activeGame.keyup) activeGame.keyup(key, event);
  });
  window.addEventListener('blur', () => keys.clear());
  document.querySelectorAll('[data-control]').forEach((button) => {
    const key = button.dataset.control === 'up' ? 'arrowup' : 'arrowdown';
    const release = () => keys.delete(key);
    button.addEventListener('pointerdown', (event) => { event.preventDefault(); keys.add(key); });
    button.addEventListener('pointerup', release);
    button.addEventListener('pointerleave', release);
    button.addEventListener('pointercancel', release);
  });

  window.Arcade = { register(name, createGame) { games.set(name, createGame); } };
})();
