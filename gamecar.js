window.onload = async function () {
  PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
  const app = new PIXI.Application({ width: 800, height: 600 });
  document.body.appendChild(app.view);

  // Load textures with PixiJS v7 Assets API
  await PIXI.Assets.addBundle('main', {
    playerCar: 'assets/car_red.png',
    enemyCar: 'assets/car1_spr.png',
    tree: 'assets/tree.png',
    road: 'assets/background-1.png'
  });

  const assets = await PIXI.Assets.loadBundle('main');

  // Background
  const background = new PIXI.TilingSprite(assets.road, 800, 600);
  app.stage.addChild(background);

  // Trees on sides
  for (let x of [0, 740]) {
    for (let y = 0; y < 600; y += 128) {
      const tree = new PIXI.Sprite(assets.tree);
      tree.x = x;
      tree.y = y;
      tree.scale.set(1.5);
      app.stage.addChild(tree);
    }
  }

  // Player Car
  const car = new PIXI.Sprite(assets.playerCar);
  car.anchor.set(0.5, 1);
  car.scale.set(1.5);
  car.x = 400;
  car.y = 570;
  app.stage.addChild(car);

  // UI
  let score = 0, level = 1, lives = 3;
  const scoreText = new PIXI.Text('Score: 0', { fill: '#fff' });
  const levelText = new PIXI.Text('Level: 1', { fill: '#fff' });
  const livesText = new PIXI.Text('Lives: 3', { fill: '#fff' });
  const messageText = new PIXI.Text('', { fill: '#0f0', fontSize: 28 });
  scoreText.position.set(10, 10);
  levelText.position.set(10, 40);
  livesText.position.set(10, 70);
  messageText.position.set(250, 200);
  app.stage.addChild(scoreText, levelText, livesText, messageText);

  const keys = { left: false, right: false };
  let vx = 0;
  const speed = 5;

  // Input handlers
  window.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'ArrowRight') keys.right = true;
    if (e.code === 'Space' && messageText.text === '') car.y -= 30;
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'ArrowRight') keys.right = false;
  });
  app.view.addEventListener('touchstart', e => {
    const x = e.touches[0].clientX;
    keys.left = x < window.innerWidth / 2;
    keys.right = !keys.left;
  });
  app.view.addEventListener('touchend', () => {
    keys.left = keys.right = false;
  });

  // Enemy Cars
  const enemies = [];
  function spawnEnemy() {
    const e = new PIXI.Sprite(assets.enemyCar);
    e.anchor.set(0.5, 1);
    e.scale.set(1.5);
    e.x = 150 + Math.floor(Math.random() * 5) * 100;
    e.y = -100;
    e.vy = 3 + level;
    app.stage.addChild(e);
    enemies.push(e);
  }
  setInterval(spawnEnemy, 1500);

  function updateUI() {
    scoreText.text = 'Score: ' + score;
    levelText.text = 'Level: ' + level;
    livesText.text = 'Lives: ' + lives;
  }

  function gameOver() {
    messageText.text = 'Game Over! Click or press SPACE to restart';
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
    car.x = 400;
    enemies.forEach(e => app.stage.removeChild(e));
    enemies.length = 0;
    updateUI();
    messageText.text = '';
    app.ticker.start();
    app.view.removeEventListener('click', restartGame);
    window.removeEventListener('keydown', spaceRestart);
  }

  // Game Loop
  app.ticker.add(() => {
    background.tilePosition.y += 4 + level * 0.3;

    // Move player
    vx = keys.left ? -speed : keys.right ? speed : 0;
    car.x += vx;
    car.x = Math.max(50, Math.min(750, car.x));

    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.y += e.vy;

      // Collision
      if (Math.abs(car.x - e.x) < 40 && Math.abs(car.y - e.y) < 80) {
        app.stage.removeChild(e);
        enemies.splice(i, 1);
        lives--;
        updateUI();
        if (lives <= 0) {
          gameOver();
          return;
        }
      }

      // Off screen
      if (e.y > 620) {
        app.stage.removeChild(e);
        enemies.splice(i, 1);
        score++;
        if (score % 10 === 0) {
          level++;
          messageText.text = 'Level Up!';
          setTimeout(() => messageText.text = '', 1500);
        }
        updateUI();
      }
    }
  });
};
