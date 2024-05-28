import 'phaser';
import { ModifiedGameConfig, PhaserAdapter } from 'src/reactComponents/phaserAdapter';
import React from 'react';
import { BootScene } from './scenes/sceneOrchestrator';
import { EntityEditorScene } from './scenes/entityEditorScene';
import { PauseScene } from 'src/scenes/pauseScene';

//import scenesJson from 'data/scenes.json'
import { Scene, ScenePersisted } from 'common/src/routes/scene/scene';
import { TsProxy } from 'src/api/tsProxy';
// import t from '../generated/testScene.js'


const editorConfig: ModifiedGameConfig = {
  title: 'TransportEngineer',
  url: 'https://github.com/ssotangkur/TransportEngineer',
  version: '2.0',
  type: Phaser.AUTO,
  scene: [BootScene, EntityEditorScene, PauseScene],
  input: {
    keyboard: true
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  backgroundColor: '#300000',
  render: { pixelArt: false, antialias: true },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // `fullscreenTarget` must be defined for phones to not have
    // a small margin during fullscreen.
    fullscreenTarget: 'app',
    expandParent: false,
  },
};


const addScenes = async (game: Phaser.Game) => {
  // Dynamically load scene modules
  const scenes = await TsProxy.scene.get()


  console.log("SODLKJDLSDLKDLKSD")
  console.log(scenes)

  scenes.forEach((sceneJson) => 
    import(`../generated/${sceneJson.name}.ts`).then((DefaultModule) => {
      const scene = new DefaultModule.default()
      game.scene.add(sceneJson.name, scene, true)
    })
  );
}

export const EditorGame = () => {
  return <PhaserAdapter config={editorConfig} onGameCreated={addScenes} />;
}

