let app, background, car, enemies = [], uiElements = [];
let score = 0, level = 1, lives = 3;
const keys = { left: false, right: false };
let speed = 5;

window.onload = async function () {
  PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

  app = new PIXI.Application({
    resizeTo: window,
    backgroundColor: 0x000000
  });
  document.body.appendChild(app.view);

  await PIXI.Assets.addBundle('main', {
    playerCar: 'assets/playerCar.png',
    enemyCar: 'assets/enemyCar.png',
    road: 'assets/road.png',
    tree: 'assets/tree.png'
  });

  const assets = await PIXI.Assets.loadBundle('main');

  // Background road
  background = new PIXI.TilingSprite(assets.road, app.screen.width, app.screen.height);
  app.stage.addChild(background);

  // Player car
  car = new PIXI.Sprite(assets.playerCar);
  car.anchor.set(0.5, 1);
  car.scale.set(1.5);
  app.stage.addChild(car);

  // UI
  const scoreText = new PIXI.Text('Score: 0', { fill: '#fff' });
  const levelText = new PIXI.Text('Level: 1', { fill: '#fff' });
  const livesText = new PIXI.Text('Lives: 3', { fill: '#fff' });
  const messageText = new PIXI.Text('', { fill: '#0f0', fontSize: 28 });

  uiElements = [scoreText, levelText, livesText, messageText];
  app.stage.addChild(...uiElements);

  // Controls
  window.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'ArrowRight') keys.right = true;
    if (e.code === 'Space' && !messageText.text) car.y -= 30;
  });

  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'ArrowRight') keys.right = false;
  });

  // Touch support
  app.view.addEventListener('touchstart', e => {
    const x = e.touches[0].clientX;
    keys.left = x < window.innerWidth / 2;
    keys.right = !keys.left;
  });
  app.view.addEventListener('touchend', () => {
    keys.left = keys.right = false;
  });

  // Spawn enemies
  setInterval(() => {
    const e = new PIXI.Sprite(assets.enemyCar);
    e.anchor.set(0.5, 1);
    e.scale.set(1.5);
    e.x = 100 + Math.floor(Math.random() * 6) * 100;
    e.y = -100;
    e.vy = 3 + level * 0.2;
    app.stage.addChild(e);
    enemies.push(e);
  }, 1500);

  // Resize support
  handleResize();
  window.addEventListener('resize', handleResize);

  app.ticker.add(updateGame);
};

// Resize logic
function handleResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  app.renderer.resize(width, height);

  if (background) {
    background.width = width;
    background.height = height;
  }

  if (car) {
    car.x = width / 2;
    car.y = height - 30;
  }

  if (uiElements.length >= 4) {
    uiElements[0].position.set(10, 10);               // Score
    uiElements[1].position.set(10, 40);               // Level
    uiElements[2].position.set(10, 70);               // Lives
    uiElements[3].position.set(width / 2 - 120, 100); // Message
  }
}

function updateUI() {
  uiElements[0].text = 'Score: ' + score;
  uiElements[1].text = 'Level: ' + level;
  uiElements[2].text = 'Lives: ' + lives;
}

function updateGame() {
  background.tilePosition.y += 4 + level * 0.3;

  let vx = keys.left ? -speed : keys.right ? speed : 0;
  car.x = Math.max(50, Math.min(app.screen.width - 50, car.x + vx));

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.y += e.vy;

    if (Math.abs(car.x - e.x) < 40 && Math.abs(car.y - e.y) < 80) {
      app.stage.removeChild(e);
      enemies.splice(i, 1);
      lives--;
      updateUI();
      if (lives <= 0) return gameOver();
    }

    if (e.y > app.screen.height + 20) {
      app.stage.removeChild(e);
      enemies.splice(i, 1);
      score++;
      if (score % 10 === 0) {
        level++;
        uiElements[3].text = 'Level Up!';
        setTimeout(() => uiElements[3].text = '', 1500);
      }
      updateUI();
    }
  }
}

function gameOver() {
  uiElements[3].text = 'Game Over! Click or SPACE to restart';
  app.ticker.stop();
  app.view.addEventListener('click', restartGame);
  window.addEventListener('keydown', spaceRestart);
}

function spaceRestart(e) {
  if (e.code === 'Space') restartGame();
}

function restartGame() {
  score = 0;
  level = 1;
  lives = 3;
  enemies.forEach(e => app.stage.removeChild(e));
  enemies.length = 0;
  updateUI();
  uiElements[3].text = '';
  car.x = app.screen.width / 2;
  app.ticker.start();
  app.view.removeEventListener('click', restartGame);
  window.removeEventListener('keydown', spaceRestart);
}
