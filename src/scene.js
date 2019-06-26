import Phaser from "phaser";
import config from "./config";

var platform = 1,
  background,
  platforms,
  cursors;
var player, enemy_one, enemy_two, stars;
var badBombs, goodBombs, yellowBalls, redBalls;
var badBombs, goodBombs, yellowBalls, redBalls;
var healthText,
  health = 100;
var scoreText,
  score = 0;
var timeText,
  time = 100,
  timer;
var bombText,
  bombs = 1;
var goodBomb;
var last_score, last_bombs;
var kicked = false,
  pressed = false;
var ground_one, ground_two, ground_three, ground_four;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("Game");
  }

  preload() {
    this.load.image("background 1", "src/assets/background 1.png");
    this.load.image("background 2", "src/assets/background 2.png");
    this.load.image("background 3", "src/assets/background 3.png");
    this.load.image("background 4", "src/assets/background 4.png");
    this.load.image("ground", "src/assets/ground.png");
    this.load.image("star", "src/assets/star.png");
    this.load.image("restart", "src/assets/restart.png");
    this.load.image("badBomb", "src/assets/badBomb.png");
    this.load.image("goodBomb", "src/assets/goodBomb.png");
    this.load.image("yellowBall", "src/assets/yellowBall.png");
    this.load.spritesheet("dude", "src/assets/dude.png", {
      frameWidth: 32,
      frameHeight: 48
    });
    this.load.spritesheet("enemy", "src/assets/enemy.png", {
      frameWidth: 34,
      frameHeight: 63
    });
  }
  create() {
    background = this.add.image(400, 300, "background " + platform);
    platforms = this.physics.add.group();

    ground_one = platforms
      .create(400, 568, "ground")
      .setScale(2)
      .setTint(0x00ff00);
    ground_two = platforms.create(600, 400, "ground").setTint(0x00ff00);
    ground_three = platforms.create(50, 250, "ground").setTint(0x00ff00);
    ground_four = platforms.create(750, 220, "ground").setTint(0x00ff00);

    platforms.children.iterate(function(child) {
      child.body.allowGravity = false;
      child.body.velocity.y = 0;
      child.body.immovable = true;
    });

    player = this.physics.add.sprite(100, 450, "dude");
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);
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

    enemy_one = this.physics.add.sprite(417, 354, "enemy");
    enemy_one.setCollideWorldBounds(true);
    enemy_two = this.physics.add.sprite(600, 500, "enemy");
    enemy_two.setCollideWorldBounds(true);

    this.anims.create({
      key: "back",
      frames: this.anims.generateFrameNumbers("enemy", { start: 0, end: 6 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "forward",
      frames: this.anims.generateFrameNumbers("enemy", { start: 7, end: 13 }),
      frameRate: 10,
      repeat: -1
    });

    cursors = this.input.keyboard.createCursorKeys();

    stars = this.physics.add.group({
      key: "star",
      repeat: 11,
      setXY: { x: 12, y: 0, stepX: 70 }
    });
    stars.children.iterate(function(child) {
      child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    badBombs = this.physics.add.group();
    yellowBalls = this.physics.add.group();
    redBalls = this.physics.add.group();
    goodBombs = this.physics.add.group();

    scoreText = this.add.text(10, 10, "score: 0", {
      fontSize: "28px",
      fill: "#000"
    });
    healthText = this.add.text(230, 10, "health: 100", {
      fontSize: "28px",
      fill: "#000"
    });
    timeText = this.add.text(440, 10, "time: 100", {
      fontSize: "28px",
      fill: "#000"
    });
    bombText = this.add.text(600, 10, "bombs: 1", {
      fontSize: "28px",
      fill: "#000"
    });

    this.physics.add.collider(player, platforms);
    this.physics.add.collider(enemy_one, platforms);
    this.physics.add.collider(enemy_two, platforms);
    this.physics.add.collider(stars, platforms);
    this.physics.add.collider(badBombs, platforms);
    this.physics.add.collider(goodBombs, platforms);
    this.physics.add.collider(yellowBalls, platforms);
    this.physics.add.collider(redBalls, platforms);
    this.physics.add.overlap(player, stars, collectStar, null, this);
    this.physics.add.overlap(player, badBombs, hitBomb, null, this);
    this.physics.add.overlap(
      enemy_one,
      goodBombs,
      () => {
        boom(enemy_one);
      },
      null,
      this
    );
    this.physics.add.overlap(
      enemy_two,
      goodBombs,
      () => {
        boom(enemy_two);
      },
      null,
      this
    );
    this.physics.add.overlap(
      player,
      yellowBalls,
      collectYellowBall,
      null,
      this
    );
    this.physics.add.overlap(player, redBalls, collectRedBall, null, this);
    this.physics.add.overlap(
      player,
      enemy_one,
      () => {
        hitEnemy(enemy_one);
      },
      null,
      this
    );
    this.physics.add.overlap(
      player,
      enemy_two,
      () => {
        hitEnemy(enemy_two);
      },
      null,
      this
    );
  }
  update() {
    if (health <= 0 || time <= 0) {
      clearInterval(timer);
      this.add
        .image(400, 300, "restart")
        .setInteractive()
        .on("pointerdown", function() {
          document.location.reload();
        });
      enemy_one.destroy();
      enemy_two.destroy();
      this.physics.pause();
    }
    if (
      Math.abs(player.body.velocity.x) < 50 &&
      Math.abs(player.body.velocity.x) > 0
    ) {
      if (player.body.velocity.x < 0) {
        player.body.velocity.x += 1;
      } else {
        player.body.velocity.x -= 1;
      }
    }
    if (
      Math.abs(player.body.velocity.x) > 50 &&
      Math.abs(player.body.velocity.x) < 160
    ) {
      if (player.body.velocity.x < 0) {
        player.body.velocity.x += 2;
        if (cursors.left.isDown && time > 0 && health > 0) {
          player.setVelocityX(-160);
          player.anims.play("left", true);
        } else if (cursors.right.isDown && time > 0 && health > 0) {
          player.anims.play("right", true);
          if (Math.abs(player.body.velocity.x) < 10) {
            player.setVelocityX(160);
          }
        }
      } else {
        player.body.velocity.x -= 2;
        if (cursors.right.isDown && time > 0 && health > 0) {
          player.setVelocityX(160);
          player.anims.play("right", true);
        } else if (cursors.left.isDown && time > 0 && health > 0) {
          player.anims.play("right", true);
          if (Math.abs(player.body.velocity.x) < 10) {
            player.setVelocityX(-160);
          }
        }
      }
    } else if (cursors.left.isDown && time > 0 && health > 0) {
      player.setVelocityX(-160);
      player.anims.play("left", true);
    } else if (cursors.right.isDown && time > 0 && health > 0) {
      player.setVelocityX(160);
      player.anims.play("right", true);
    } else if (Math.abs(player.body.velocity.x) == 160) {
      player.setVelocityX(0);
      player.anims.play("turn");
    }
    if (cursors.up.isDown && player.body.touching.down) {
      player.setVelocityY(-330);
    }
    if (
      cursors.shift.isDown &&
      player.body.touching.down &&
      bombs &&
      !pressed
    ) {
      goodBomb = goodBombs.create(player.x, player.y, "goodBomb");
      goodBomb.setCollideWorldBounds(true);
      bombText.setText("bombs: " + --bombs);
      pressed = true;
      setTimeout(() => {
        pressed = false;
      }, 1000);
    }
    if (cursors.down.isDown && !player.body.touching.down) {
      player.body.velocity.y += 10;
    }
    if (time > 0 && health > 0) {
      if (enemy_one.body.x <= ground_two.body.x) {
        enemy_one.setVelocityX(100);
        enemy_one.anims.play("forward", true);
      } else if (enemy_one.body.x >= 366 + ground_two.body.x) {
        enemy_one.setVelocityX(-100);
        enemy_one.anims.play("back", true);
      }
      if (enemy_two.body.x <= ground_one.body.x + 10) {
        enemy_two.setVelocityX(100);
        enemy_two.anims.play("forward", true);
      } else if (enemy_two.body.x >= ground_one.body.width - 34) {
        enemy_two.setVelocityX(-100);
        enemy_two.anims.play("back", true);
      } else if (!enemy_two.body.velocity.x) {
        enemy_two.setVelocityX(-100);
        enemy_two.anims.play("back", true);
      }
    }
  }
}

function collectStar(player, star) {
  star.disableBody(true, true);
  score += 10;
  scoreText.setText("score: " + score);
  if (stars.countActive(true) === 0) {
    stars.children.iterate(function(child) {
      child.enableBody(true, child.x, 0, true, true);
    });
    var badBomb = badBombs.create(
      player.x < 400
        ? Phaser.Math.Between(400, 800)
        : Phaser.Math.Between(0, 400),
      16,
      "badBomb"
    );
    badBomb.setBounce(1);
    badBomb.setCollideWorldBounds(true);
    badBomb.setVelocity(
      Phaser.Math.Between(-200, 200),
      Phaser.Math.Between(15, 20)
    );
    badBomb.allowGravity = false;
  }
}

function hit(player, damage) {
  player.anims.play("turn");
  player.setTint(0xff0000);
  setTimeout("player.setTint(0xffffff);", 100, player);
  health -= damage;
  healthText.setText("health: " + health);
}

function hitBomb(player, badBomb) {
  hit(player, 30);
  badBomb.destroy();
}

function hitEnemy(enemy) {
  if (!kicked) {
    hit(player, 20);
    player.setVelocityY(-100);
    if (enemy.body.velocity.x < 0) {
      player.body.x -= 20;
      player.setVelocityX(-159);
    } else if (enemy.body.velocity.x > 0) {
      player.body.x += 20;
      player.setVelocityX(159);
    }
    kicked = true;
    setTimeout(() => {
      kicked = false;
    }, 3000);
  }
}

function boom(enemy) {
  enemy.disableBody(true, true);
  goodBomb.destroy();
}
function dropYellowBall() {
  var yellowBall = yellowBalls.create(
    player.x < 400
      ? Phaser.Math.Between(400, 800)
      : Phaser.Math.Between(0, 400),
    16,
    "yellowBall"
  );
  yellowBall.setCollideWorldBounds(true);
  yellowBall.setVelocity(
    Phaser.Math.Between(-200, 200),
    Phaser.Math.Between(15, 20)
  );
  yellowBall.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
}

function dropRedBall() {
  var redBall = redBalls.create(
    player.x < 400
      ? Phaser.Math.Between(400, 800)
      : Phaser.Math.Between(0, 400),
    16,
    "badBomb"
  );
  redBall.setBounce(0.9);
  redBall.allowGravity = false;
  redBall.setCollideWorldBounds(true);
  redBall.setVelocity(
    Phaser.Math.Between(-200, 200),
    Phaser.Math.Between(15, 20)
  );
}

function collectYellowBall(player, yelloBall) {
  yelloBall.destroy(true, true);
  last_score = score;
  last_bombs = bombs;
  set_platform(++platform);
  bombs++;
  bombText.setText("bombs: " + bombs);
}

function collectRedBall(player, redBall) {
  redBall.destroy(true, true);
  if (platform > 1) {
    score = last_score;
    bombs = last_bombs;
    scoreText.setText("score: " + score);
    bombText.setText("bombs: " + bombs);
    set_platform(--platform);
  } else {
    health -= 10;
    healthText.setText("health: " + health);
  }
}

setTimeout(dropYellowBall, Phaser.Math.Between(15000, 20000));
setTimeout(dropRedBall, Phaser.Math.Between(15000, 20000));

document.addEventListener(
  "DOMContentLoaded",
  () => {
    timer = setInterval(() => {
      timeText.setText("time: " + --time);
    }, 1000);
  },
  false
);

function set_platform(platform) {
  background.setTexture("background " + platform);
  player.body.x = 150;
  player.body.y = 450;
  enemy_two.enableBody(true, 600, 460, true, true);
  if (platform == 1) {
    ground_two.body.x = 400;
    ground_two.body.y = 384;
    ground_three.body.x = -150;
    ground_three.body.y = 234;
    ground_four.body.x = 550;
    ground_four.body.y = 204;
  } else if (platform == 2) {
    ground_two.body.x = 200;
    ground_two.body.y = 384;
    ground_three.body.x = -300;
    ground_three.body.y = 234;
    ground_four.body.x = 700;
    ground_four.body.y = 234;
    ground_one.setTint(0x0000ff);
    ground_two.setTint(0x0000ff);
    ground_three.setTint(0x0000ff);
    ground_four.setTint(0x0000ff);
  } else if (platform == 3) {
    ground_two.body.x = 320;
    ground_two.body.y = 300;
    ground_three.body.x = -200;
    ground_three.body.y = 360;
    ground_four.body.x = 550;
    ground_four.body.y = 145;
    ground_one.setTint(0xffffff);
    ground_two.setTint(0xffffff);
    ground_three.setTint(0xffffff);
    ground_four.setTint(0xffffff);
  } else if (platform == 4) {
    ground_two.body.x = 140;
    ground_two.body.y = 200;
    ground_three.body.x = -200;
    ground_three.body.y = 359;
    ground_four.body.x = 625;
    ground_four.body.y = 369;
    ground_one.setTint(0xffffff);
    ground_two.setTint(0xffffff);
    ground_three.setTint(0xffffff);
    ground_four.setTint(0xffffff);
  }
  enemy_one.enableBody(
    true,
    ground_two.body.x + 17,
    ground_two.body.y - 60,
    true,
    true
  );
  stars.children.iterate(function(child) {
    child.enableBody(true, child.x, 0, true, true);
  });
  badBombs.children.iterate(function(child) {
    child.body.y = 0;
    child.body.x =
      player.x < 400
        ? Phaser.Math.Between(400, 800)
        : Phaser.Math.Between(0, 400);
  });
  goodBombs.children.iterate(function(child) {
    child.destroy();
  });
  yellowBalls.children.iterate(function(child) {
    child.destroy();
  });
  redBalls.children.iterate(function(child) {
    child.destroy();
  });
  if (platform < 4 && health > 0 && time > 0) {
    setTimeout(dropYellowBall, Phaser.Math.Between(15000, 20000));
  }
  if (platform < 4 && health > 0 && time > 0) {
    setTimeout(dropRedBall, Phaser.Math.Between(15000, 20000));
  }
}
