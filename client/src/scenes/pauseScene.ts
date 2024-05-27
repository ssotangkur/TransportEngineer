import 'phaser';
import particleUrl from '/assets/particle.png';
import gaspUrl from '/assets/gasp.mp3';
import { Scenes } from 'src/editor/scenes/sceneOrchestrator';
import { OrchestratableScene } from 'src/editor/scenes/orchestratableScene';

export const pauseSceneName = 'PauseScene';

export class PauseScene extends OrchestratableScene {
  private startKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super(Scenes.PAUSE);
  }

  preload(): void {
    if (this.input.keyboard) {
      this.startKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.S,
      );
      this.startKey.isDown = false;
    }
    this.load.image('particle', particleUrl);
    this.load.audio('gasp', gaspUrl);
  }

  create(): void {
    this.add.text(0, 0, 'Press space to continue', {
      fontSize: '60px',
      fontFamily: "Helvetica",
    });
  }

  update(time: number, delta: number): void {
    super.update(time, delta);
    if (this.startKey.isDown) {
      this.sound.play('gasp');
      this.scene.start(this);
    }
  }
}