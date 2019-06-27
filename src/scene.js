import Phaser from "phaser";

var platform = 1,
  background,
  platforms,
  cursors;
var player, firstEnemy, secondEnemy, stars;
var badBombs, goodBombs, collectableBombs, randomBombs;
var healthText,
  health = 100;
var scoreText,
  score = 0;
var timeText,
  time = 99,
  timer;
var bombText,
  bombs = 1;
var goodBomb;
var lastScore, lastBombs;
var kicked = false,
  pressed = false;
var firstGround, secondGround, thirdGround, fourthGround;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("Game");
  }

  preload() {
    //Load Sprites
    this.load.image("background 1", "src/assets/background 1.png");
    this.load.image("background 2", "src/assets/background 2.png");
    this.load.image("background 3", "src/assets/background 3.png");
    this.load.image("background 4", "src/assets/background 4.png");
    this.load.image("ground", "src/assets/ground.png");
    this.load.image("star", "src/assets/star.png");
    this.load.image("restart", "src/assets/restart.png");
    this.load.image("badBomb", "src/assets/badBomb.png");
    this.load.image("goodBomb", "src/assets/goodBomb.png");
    this.load.image("collectableBomb", "src/assets/collectableBomb.png");
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
    /** Add Platforms */
    background = this.add.image(400, 300, "background " + platform);
    platforms = this.physics.add.group();

    firstGround = platforms
      .create(400, 568, "ground")
      .setScale(2)
      .setTint(0x00ff00);
    secondGround = platforms.create(600, 400, "ground").setTint(0x00ff00);
    thirdGround = platforms.create(50, 250, "ground").setTint(0x00ff00);
    fourthGround = platforms.create(750, 220, "ground").setTint(0x00ff00);

    // Move platforms between levels without gravity
    platforms.children.iterate(function(child) {
      child.body.allowGravity = false;
      child.body.velocity.y = 0;
      child.body.immovable = true;
    });

    /**Add Player */

    player = this.physics.add.sprite(100, 450, "dude");
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    //Move player with keyboard
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

    /**Add Enemies */
    firstEnemy = this.physics.add.sprite(417, 354, "enemy");
    firstEnemy.setCollideWorldBounds(true);
    secondEnemy = this.physics.add.sprite(600, 500, "enemy");
    secondEnemy.setCollideWorldBounds(true);

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

    // inbuilt Phaser keyboard handler
    cursors = this.input.keyboard.createCursorKeys();

    /**Add Stars */
    stars = this.physics.add.group({
      key: "star",
      repeat: 11,
      setXY: { x: 12, y: 0, stepX: 70 }
    });
    stars.children.iterate(function(child) {
      child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    /**Add Bombs */
    badBombs = this.physics.add.group();
    collectableBombs = this.physics.add.group();
    randomBombs = this.physics.add.group();
    goodBombs = this.physics.add.group();

    /**Text Display */
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

    /**Collide objects with platform to avoid falling off */
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(firstEnemy, platforms);
    this.physics.add.collider(secondEnemy, platforms);
    this.physics.add.collider(stars, platforms);
    this.physics.add.collider(badBombs, platforms);
    this.physics.add.collider(goodBombs, platforms);
    this.physics.add.collider(collectableBombs, platforms);
    this.physics.add.collider(randomBombs, platforms);
    this.physics.add.overlap(player, stars, collectStar, null, this);
    this.physics.add.overlap(player, badBombs, hitBomb, null, this);
    this.physics.add.overlap(
      firstEnemy,
      goodBombs,
      () => {
        boom(firstEnemy);
      },
      null,
      this
    );
    this.physics.add.overlap(
      secondEnemy,
      goodBombs,
      () => {
        boom(secondEnemy);
      },
      null,
      this
    );
    this.physics.add.overlap(
      player,
      collectableBombs,
      pickCollectableBomb,
      null,
      this
    );
    this.physics.add.overlap(
      player,
      randomBombs,
      collectRandomBombs,
      null,
      this
    );
    this.physics.add.overlap(
      player,
      firstEnemy,
      () => {
        hitEnemy(firstEnemy);
      },
      null,
      this
    );
    this.physics.add.overlap(
      player,
      secondEnemy,
      () => {
        hitEnemy(secondEnemy);
      },
      null,
      this
    );
  }
  update() {
    /**Restart game on set conditions */
    if (health <= 0 || time <= 0) {
      clearInterval(timer);
      this.add
        .image(400, 300, "restart")
        .setInteractive()
        .on("pointerdown", function() {
          document.location.reload();
        });

      this.add.text(250, 350, "Final Score: " + score, {
        fontSize: "28px",
        stroke: "#fff",
        strokeThickness: 10,
        fill: "#000"
      });
      firstEnemy.destroy();
      secondEnemy.destroy();
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
      //Drop bombs for enemies if space key is pressed
      cursors.space.isDown &&
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
      //Move enemies
      if (firstEnemy.body.x <= secondGround.body.x) {
        firstEnemy.setVelocityX(100);
        firstEnemy.anims.play("forward", true);
      } else if (firstEnemy.body.x >= 366 + secondGround.body.x) {
        firstEnemy.setVelocityX(-100);
        firstEnemy.anims.play("back", true);
      }
      if (secondEnemy.body.x <= firstGround.body.x + 10) {
        secondEnemy.setVelocityX(100);
        secondEnemy.anims.play("forward", true);
      } else if (secondEnemy.body.x >= firstGround.body.width - 34) {
        secondEnemy.setVelocityX(-100);
        secondEnemy.anims.play("back", true);
      } else if (!secondEnemy.body.velocity.x) {
        secondEnemy.setVelocityX(-100);
        secondEnemy.anims.play("back", true);
      }
    }
  }
}

function collectStar(player, star) {
  //Collect Stars and get points
  star.disableBody(true, true);
  score += 10;
  scoreText.setText("score: " + score);

  //Add bombs if stars are finished on the platform
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
  //Add damage to player and turn dude red
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
  //Player colliding with enemy
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
  //Hit enemy with bomb
  enemy.disableBody(true, true);
  goodBomb.destroy();
}
function dropCollectableBomb() {
  //Drop ball to be collected as good bomb
  var collectableBomb = collectableBombs.create(
    player.x < 400
      ? Phaser.Math.Between(400, 800)
      : Phaser.Math.Between(0, 400),
    16,
    "collectableBomb"
  );
  collectableBomb.setCollideWorldBounds(true);
  collectableBomb.setVelocity(
    Phaser.Math.Between(-200, 200),
    Phaser.Math.Between(15, 20)
  );
  collectableBomb.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
}

function addRandomBomb() {
  //Add Bad Bomb
  var randomBomb = randomBombs.create(
    player.x < 400
      ? Phaser.Math.Between(400, 800)
      : Phaser.Math.Between(0, 400),
    16,
    "badBomb"
  );
  randomBomb.setBounce(0.9);
  randomBomb.allowGravity = false;
  randomBomb.setCollideWorldBounds(true);
  randomBomb.setVelocity(
    Phaser.Math.Between(-200, 200),
    Phaser.Math.Between(15, 20)
  );
}

function pickCollectableBomb(player, yelloBall) {
  //Keep latest score and items and move to next platform
  yelloBall.destroy(true, true);
  lastScore = score;
  lastBombs = bombs;
  setPlatform(++platform);
  bombs++;
  bombText.setText("bombs: " + bombs);
}

function collectRandomBombs(player, randomBomb) {
  //Collide with bad bomb
  randomBomb.destroy(true, true);
  if (platform > 1) {
    //Move level back one platform
    score = lastScore;
    bombs = lastBombs;
    scoreText.setText("score: " + score);
    bombText.setText("bombs: " + bombs);
    setPlatform(--platform);
  } else {
    health -= 10;
    healthText.setText("health: " + health);
  }
}

setTimeout(dropCollectableBomb, Phaser.Math.Between(15000, 20000));
setTimeout(addRandomBomb, Phaser.Math.Between(15000, 20000));

//Add Timer
document.addEventListener(
  "DOMContentLoaded",
  () => {
    timer = setInterval(() => {
      timeText.setText("time: " + --time);
    }, 1000);
  },
  false
);

function setPlatform(platform) {
  background.setTexture("background " + platform);
  player.body.x = 150;
  player.body.y = 450;
  secondEnemy.enableBody(true, 600, 460, true, true);
  if (platform == 1) {
    //Position platforms
    secondGround.body.x = 400;
    secondGround.body.y = 384;
    thirdGround.body.x = -150;
    thirdGround.body.y = 234;
    fourthGround.body.x = 550;
    fourthGround.body.y = 204;
  } else if (platform == 2) {
    secondGround.body.x = 200;
    secondGround.body.y = 384;
    thirdGround.body.x = -300;
    thirdGround.body.y = 234;
    fourthGround.body.x = 700;
    fourthGround.body.y = 234;

    //Change color of platforms
    firstGround.setTint(0x0000ff);
    secondGround.setTint(0x0000ff);
    thirdGround.setTint(0x0000ff);
    fourthGround.setTint(0x0000ff);
  } else if (platform == 3) {
    secondGround.body.x = 320;
    secondGround.body.y = 300;
    thirdGround.body.x = -200;
    thirdGround.body.y = 360;
    fourthGround.body.x = 550;
    fourthGround.body.y = 145;
    firstGround.setTint(0xffffff);
    secondGround.setTint(0xffffff);
    thirdGround.setTint(0xffffff);
    fourthGround.setTint(0xffffff);
  } else if (platform == 4) {
    secondGround.body.x = 140;
    secondGround.body.y = 200;
    thirdGround.body.x = -200;
    thirdGround.body.y = 359;
    fourthGround.body.x = 625;
    fourthGround.body.y = 369;
    firstGround.setTint(0xffffff);
    secondGround.setTint(0xffffff);
    thirdGround.setTint(0xffffff);
    fourthGround.setTint(0xffffff);
  }
  firstEnemy.enableBody(
    true,
    secondGround.body.x + 17,
    secondGround.body.y - 60,
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

  //Clear used good and bombs
  goodBombs.children.iterate(function(child) {
    child.destroy();
  });
  collectableBombs.children.iterate(function(child) {
    child.destroy();
  });
  randomBombs.children.iterate(function(child) {
    child.destroy();
  });

  //Set timeout for good and bad bombs
  if (platform < 4 && health > 0 && time > 0) {
    setTimeout(dropCollectableBomb, Phaser.Math.Between(15000, 20000));
  }
  if (platform < 4 && health > 0 && time > 0) {
    setTimeout(addRandomBomb, Phaser.Math.Between(15000, 20000));
  }
}
