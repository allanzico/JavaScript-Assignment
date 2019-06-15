import Phaser from "phaser";
import config from "./config";
import scene from "./scene";
import GameScene from "./scene";

class Game extends Phaser.Game {
  constructor() {
    super(config);
    this.scene.add("Game", GameScene);
    this.scene.start("Game");
  }
}
window.onload = function() {
  window.game = new Game();
};
