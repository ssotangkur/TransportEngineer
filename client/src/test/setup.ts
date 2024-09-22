// test/setup.js
import 'vitest-canvas-mock' // Phaser needs canvas API but jsdom doesn't provide one
import Phaser from 'phaser'

// Make Phaser available globally if necessary
global.Phaser = Phaser
