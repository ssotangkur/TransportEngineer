import { OrchestratableScene } from './orchestratableScene'

export class BootScene extends OrchestratableScene {
  constructor() {
    super('boot')
  }

  create() {
    this.add.text(0, 0, 'Booting...')
    // new SceneOrchestrator();
    // setTimeout(() => {
    //   this.scene.switch(Scenes.EDITOR);
    // }, 2000)
  }
}
