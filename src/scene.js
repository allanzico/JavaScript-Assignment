import Phaser from "phaser";
var platforms;

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
  }

  create() {
    this.add.image(400, 300, "sky");

    platforms = this.physics.add.staticGroup();
    platforms
      .create(400, 568, "ground")
      .setScale(2)
      .refreshBody();
    platforms.create(600, 400, "ground");
    platforms.create(50, 250, "ground");
    platforms.create(750, 220, "ground");
  }

  update() {}
}
