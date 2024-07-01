import React from 'react'
import { MenuScene } from 'src/scenes/menu-scene'
import { PhaserAdapter } from './phaserAdapter'

const mainGameConfig: Omit<Phaser.Types.Core.GameConfig, 'parent'> = {
  title: 'TransportEngineer',
  url: 'https://github.com/ssotangkur/TransportEngineer',
  version: '2.0',
  type: Phaser.AUTO,
  scene: [MenuScene],
  input: {
    keyboard: true,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  backgroundColor: '#300000',
  render: { pixelArt: false },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // `fullscreenTarget` must be defined for phones to not have
    // a small margin during fullscreen.
    fullscreenTarget: 'app',
    expandParent: false,
  },
}

export const MainGame = () => <PhaserAdapter config={mainGameConfig} />
