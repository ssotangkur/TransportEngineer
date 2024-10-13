import { IWorld } from 'bitecs'
import { BaseSystem } from './baseSystem'
import _ from 'lodash'
import { Events } from 'src/events/events'

export class UpdateTimerSystem<WorldIn extends IWorld> extends BaseSystem<IWorld, WorldIn, IWorld> {
  createWorld(_worldIn: IWorld) {
    return _worldIn
  }

  private startTime: number = 0
  private stepTime: number = 0

  create() {
    this.scene.game.events.on(Phaser.Core.Events.PRE_STEP, () => {
      this.startTime = window.performance.now()
    })

    this.scene.game.events.on(Phaser.Core.Events.POST_RENDER, () => {
      this.stepTime = window.performance.now() - this.startTime
      Events.emit('updateStepTime', this.stepTime)
    })
  }
}
