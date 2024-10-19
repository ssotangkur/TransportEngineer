import { Events } from 'src/events/events'
import Phaser from 'phaser'

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
        // Note: we pass "this" as the parent scene which the dependent scenes
        // can get through their init() and create() methods
        return this.scene.add('', scene, true, this)
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

export type SceneCommand = {
  type: 'switch' | 'pause'
  source: '*' | string
  target: string
}

export const createSwitchCommand = (target: string): SceneCommand => {
  return {
    type: 'switch',
    source: '*',
    target,
  }
}

const sceneCommandQueue: SceneCommand[] = []

Events.on('unpause', () => {
  sceneCommandQueue.push(createSwitchCommand('editor'))
})
Events.on('pause', () => {
  sceneCommandQueue.push(createSwitchCommand('pause'))
})
Events.on('boot', () => {
  sceneCommandQueue.push(createSwitchCommand('boot'))
})

export const processNextSceneCommands = (scene: OrchestratableScene) => {
  const command = sceneCommandQueue.pop()
  if (!command) {
    return
  }

  if (command.source === '*' || command.source === scene.name) {
    switch (command.type) {
      case 'switch':
        scene.scene.switch(command.target)
        break
      case 'pause':
        scene.scene.pause(command.target)
        break
    }
  } else {
    // commands not related to this scene should be pushed back onto the queue
    sceneCommandQueue.push(command)
  }
}
