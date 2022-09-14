import { Events } from "src/events/events";
import { OrchestratableScene } from "./orchestratableScene";

export enum Scenes {
  BOOT = "boot",
  EDITOR = "editor",
  PAUSE = "pause",
}

export class BootScene extends OrchestratableScene {

  constructor() {
    super(Scenes.BOOT);
  }

  create () {
    this.add.text(0, 0, 'Booting...');
    // new SceneOrchestrator();
    // setTimeout(() => {
    //   this.scene.switch(Scenes.EDITOR);
    // }, 2000)
  }

}

export type SceneCommand = {
  type: 'switch' | 'pause',
  source: '*' | Scenes,
  target: Scenes,
}

export const createSwitchCommand = (target: Scenes): SceneCommand => {
  return {
    type: 'switch',
    source: '*',
    target,
  }
} 

const sceneCommandQueue: SceneCommand[] = [];


Events.on('unpause', () => {
  sceneCommandQueue.push(createSwitchCommand(Scenes.EDITOR));
});
Events.on('pause', () => {
  sceneCommandQueue.push(createSwitchCommand(Scenes.PAUSE));
});
Events.on('boot', () => {
  sceneCommandQueue.push(createSwitchCommand(Scenes.EDITOR));
});


export const processNextSceneCommands = (scene: OrchestratableScene) => {
  const command = sceneCommandQueue.pop();
  if(!command) { return; }

  if(command.source === '*' || command.source === scene.name) {
    switch(command.type) {
      case 'switch':
        scene.scene.switch(command.target);
        break;
      case 'pause':
        scene.scene.pause(command.target);
        break;
    }
  } else {
    // commands not related to this scene should be pushed back onto the queue
    sceneCommandQueue.push(command);
  }
}