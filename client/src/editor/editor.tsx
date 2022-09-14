import 'phaser';
import { ModifiedGameConfig, PhaserAdapter } from 'src/reactComponents/phaserAdapter';
import React from 'react';
import { BootScene } from './scenes/sceneOrchestrator';
import { EntityEditorScene } from './scenes/entityEditorScene';
import { PauseScene } from 'src/scenes/pauseScene';

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


export const EditorGame = () => {
  return <PhaserAdapter config={editorConfig} />;
}