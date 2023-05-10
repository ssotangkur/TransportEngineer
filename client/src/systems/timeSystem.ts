import { IWorld } from 'bitecs'
import { BaseSystem } from './baseSystem'

export type TimeWorld = {
  time: number
  delta: number
}

export class TimeSystem<WorldIn extends IWorld> extends BaseSystem<IWorld, WorldIn, TimeWorld> {
  createWorld(_worldIn: IWorld): TimeWorld {
    return {
      time: 0,
      delta: 0,
    }
  }

  update(time: number, delta: number) {
    this.world.time = time
    this.world.delta = delta
  }
}
