import { processNextSceneCommands } from './sceneOrchestrator'
import Phaser from 'phaser'

/**
 * Phaser allows the key to be embedded in the scene config or defined
 * externally. This makes it confusing to know which key takes precedence.
 *
 */
export type KeyedScene = {
  key: string
  scene: Phaser.Types.Scenes.SceneType
}

/**
 * This represents a top level scene that is responsible for adding
 * all of it's sub-scenes.
 */
export class OrchestratableScene extends Phaser.Scene {
  public name: string

  private dependentSceneInstances: Phaser.Scene[] = []

  constructor(
    config?: ConstructorParameters<typeof Phaser.Scene>[0],
    private dependentScenes?: Phaser.Types.Scenes.SceneType[],
  ) {
    super(config)

    this.name = 'anonymous'
    if (config) {
      if (typeof config == 'string') {
        this.name = config
      } else if (config.key) {
        this.name = config.key
      }
    }
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
      this.forEachDepScene((scene) => {
        scene.scene.pause()
      })
    })
    this.events.on(Phaser.Scenes.Events.WAKE, () => {
      console.info(`Scene: [${this.name}] WAKE`)
      this.forEachDepScene((scene) => {
        scene.scene.wake()
      })
    })
    this.events.on(Phaser.Scenes.Events.RESUME, () => {
      console.info(`Scene: [${this.name}] RESUME`)
      this.forEachDepScene((scene) => {
        scene.scene.resume()
      })
    })
    this.events.on(Phaser.Scenes.Events.SLEEP, () => {
      console.info(`Scene: [${this.name}] SLEEP`)
      this.forEachDepScene((scene) => {
        scene.scene.sleep()
      })
    })
    this.events.on(Phaser.Scenes.Events.DESTROY, () => {
      console.info(`Scene: [${this.name}] DESTROY`)
      this.forEachDepScene((scene) => {
        scene.scene.stop()
      })
    })

    // Add dependent scenes, which instantiates them
    this.dependentSceneInstances = (this.dependentScenes ?? [])
      .map((scene) => {
        return this.scene.add('', scene, true)
      })
      .filter((scene): scene is Phaser.Scene => {
        if (!scene) {
          console.warn(`Scene not added`)
          return false
        }
        return true
      })
  }

  // For each dependent scene
  private forEachDepScene(cb: (scene: Phaser.Scene) => void) {
    for (const scene of this.dependentSceneInstances ?? []) {
      cb(scene)
    }
  }

  /**
   * Subclasses must call super.update() for scene orchestration to work
   */
  update(time: number, delta: number) {
    super.update(time, delta)
    processNextSceneCommands(this)
  }
}
