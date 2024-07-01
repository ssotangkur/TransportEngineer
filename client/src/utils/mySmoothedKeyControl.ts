// Copied from https://github.com/phaserjs/phaser/blob/v3.80.0/src/cameras/controls/SmoothedKeyControl.js

import _ from 'lodash'

/**
 * @classdesc
 * A Smoothed Key Camera Control.
 *
 * This differs from Phasers version in that the speed changes relative to the zoom level
 *
 * This allows you to control the movement and zoom of a camera using the defined keys.
 * Unlike the Fixed Camera Control you can also provide physics values for acceleration, drag and maxSpeed for smoothing effects.
 *
 * ```javascript
 * var controlConfig = {
 *     camera: this.cameras.main,
 *     left: cursors.left,
 *     right: cursors.right,
 *     up: cursors.up,
 *     down: cursors.down,
 *     zoomIn: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
 *     zoomOut: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
 *     zoomSpeed: 0.02,
 *     acceleration: 0.06,
 *     drag: 0.0005,
 *     maxSpeed: 1.0
 * };
 * ```
 *
 * You must call the `update` method of this controller every frame.
 *
 * @class MySmoothedKeyControl
 * @memberof Phaser.Cameras.Controls
 * @constructor
 * @since 3.0.0
 *
 * @param {Phaser.Types.Cameras.Controls.SmoothedKeyControlConfig} config - The Smoothed Key Control configuration object.
 */
export class MySmoothedKeyControl extends Phaser.Cameras.Controls.SmoothedKeyControl {
  origAccelX: number
  origAccelY: number
  origMaxSpeedX: number
  origMaxSpeedY: number
  origZoomSpeed: number

  constructor(config: Phaser.Types.Cameras.Controls.SmoothedKeyControlConfig) {
    super(config)
    // Copy the values parsed from config since we will modify them dynamically
    this.origAccelX = this.accelX
    this.origAccelY = this.accelY
    this.origMaxSpeedX = this.maxSpeedX
    this.origMaxSpeedY = this.maxSpeedY
    this.origZoomSpeed = this.zoomSpeed
  }

  /**
   * Applies the results of pressing the control keys to the Camera.
   *
   * You must call this every step, it is not called automatically.
   *
   * @method Phaser.Cameras.Controls.SmoothedKeyControl#update
   * @since 3.0.0
   *
   * @param {number} delta - The delta time in ms since the last frame. This is a smoothed and capped value based on the FPS rate.
   */
  update(delta: number) {
    if (!this.active) {
      return
    }

    if (delta === undefined) {
      delta = 1
    }

    var cam = this.camera!

    // We override the public variables based on zoom level
    // and let the super class do the rest of the work
    this.accelX = this.origAccelX * (1 / (cam.zoom + 1))
    this.accelY = this.origAccelY * (1 / (cam.zoom + 1))
    this.maxSpeedX = this.origMaxSpeedX * (1 / (cam.zoom + 1))
    this.maxSpeedY = this.origMaxSpeedY * (1 / (cam.zoom + 1))
    this.zoomSpeed = this.origZoomSpeed * 0.5 * cam.zoom

    super.update(delta)
  }
}
