import { processNextSceneCommands } from './sceneOrchestrator'
import Phaser from 'phaser'

export class OrchestratableScene extends Phaser.Scene {
  constructor(public name: string) {
    super(name)
  }

  /**
   * Subclasses must call super.init() for scene orchestration to work
   */
  init() {
    this.events.on(Phaser.Scenes.Events.CREATE, () => {
      console.info(`Scene: [${this.name}] CREATE`)
    })
    this.events.on(Phaser.Scenes.Events.PAUSE, () => {
      console.info(`Scene: [${this.name}] PAUSE`)
    })
    this.events.on(Phaser.Scenes.Events.WAKE, () => {
      console.info(`Scene: [${this.name}] WAKE`)
    })
    this.events.on(Phaser.Scenes.Events.RESUME, () => {
      console.info(`Scene: [${this.name}] RESUME`)
    })
    this.events.on(Phaser.Scenes.Events.SLEEP, () => {
      console.info(`Scene: [${this.name}] SLEEP`)
    })
    this.events.on(Phaser.Scenes.Events.DESTROY, () => {
      console.info(`Scene: [${this.name}] DESTROY`)
    })
  }

  /**
   * Subclasses must call super.update() for scene orchestration to work
   */
  update(time: number, delta: number) {
    super.update(time, delta)
    processNextSceneCommands(this)
  }
}
