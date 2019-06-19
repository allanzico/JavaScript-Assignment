import Phaser from "phaser";

let platforms;
let player;
let keyboardInput;
let stars;
let score = 0;
let scoreText;
let gameOver = false;
let enemy;
let enemies = [];
let enemiesToSpawn = 6;
let enemiesLeft = enemiesLeft;
let bombs;
let baddieMoveTween;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("Game");
  }
  preload() {
    this.load.image("sky", "src/assets/sky.png");
    this.load.image("ground", "src/assets/platform.png");
    this.load.image("star", "src/assets/star.png");
    this.load.image("bomb", "src/assets/bomb.png");
    this.load.spritesheet("dude", "src/assets/dude.png", {
      frameWidth: 32,
      frameHeight: 48
    });
    this.load.spritesheet("baddie", "src/assets/baddie.png", {
      frameWidth: 32,
      frameHeight: 32
    });
  }

  create() {
    this.add.image(400, 300, "sky");
    scoreText = this.add.text(16, 16, "score: 0", {
      fontSize: "32px",
      fill: "#000"
    });
    //Create Static Platform not affected by gravity
    platforms = this.physics.add.staticGroup();
    platforms
      .create(400, 568, "ground")
      .setScale(2)
      .refreshBody();
    platforms.create(600, 400, "ground");
    platforms.create(50, 250, "ground");
    platforms.create(750, 220, "ground");

    //Add player
    player = this.physics.add.sprite(100, 450, "dude");
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    //Define player animations from the tilesheet; Move left, right, turn
    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: "turn",
      frames: [{ key: "dude", frame: 4 }],
      frameRate: 20
    });

    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1
    });

    //Phaser Inbuilt Keyboard manager
    keyboardInput = this.input.keyboard.createCursorKeys();

    //Add Stars
    stars = this.physics.add.group({
      key: "star",
      repeat: 1,
      setXY: { x: 12, y: 0, stepX: 70 }
    });

    stars.children.iterate(function(child) {
      child.setBounceY(Phaser.Math.FloatBetween(0.2, 0.4));
    });

    //Add Bombs
    bombs = this.physics.add.group();

    //Add Enemies
    enemies = this.physics.add.group({
      key: "baddie",
      repeat: enemiesToSpawn
    });

    enemies.children.iterate(function(enemy) {
      enemy.setBounceY(Phaser.Math.FloatBetween(0.2, 0.4));
    });

    //Make objects collide with platform and stay static
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(stars, platforms);
    this.physics.add.collider(enemies, platforms);
    this.physics.add.collider(bombs, platforms);
    this.physics.add.collider(player, bombs, hitBomb, null, this);
    this.physics.add.overlap(player, stars, collectStar, null, this);
  }

  update() {
    if (keyboardInput.left.isDown) {
      player.setVelocityX(-160);

      player.anims.play("left", true);
    } else if (keyboardInput.right.isDown) {
      player.setVelocityX(160);

      player.anims.play("right", true);
    } else {
      player.setVelocityX(0);

      player.anims.play("turn");
    }

    if (keyboardInput.up.isDown && player.body.touching.down) {
      player.setVelocityY(-330);
    }
  }
}

function collectStar(player, star) {
  star.disableBody(true, true);
  score += 10;
  scoreText.setText("Score: " + score);
  if (stars.countActive(true) === 0) {
    stars.children.iterate(function(child) {
      child.enableBody(true, child.x, 0, true, true);
    });

    var x =
      player.x < 400
        ? Phaser.Math.Between(400, 800)
        : Phaser.Math.Between(0, 400);

    var bomb = bombs.create(x, 16, "bomb");
    bomb.setBounce(1);
    bomb.setCollideWorldBounds(true);
    bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
  }
}
function hitBomb(player, bomb) {
  this.physics.pause();

  player.setTint(0xff0000);

  player.anims.play("turn");

  gameOver = true;
}
