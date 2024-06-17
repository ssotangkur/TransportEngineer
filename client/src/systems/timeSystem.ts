import { IWorld, addComponent, defineQuery } from 'bitecs'
import { BaseSystem } from './baseSystem'
import { TimeComponent } from 'src/components/timeComponent'
import { SingletonWorld } from './singletonSystem'

export type TimeWorld = {
  time: number
  delta: number
}

const timeQuery = defineQuery([TimeComponent])

export class TimeSystem<WorldIn extends SingletonWorld> extends BaseSystem<SingletonWorld, WorldIn, TimeWorld> {
  createWorld(_worldIn: IWorld): TimeWorld {
    return {
      time: 0,
      delta: 0,
    }
  }

  create() {
    addComponent(this.world, TimeComponent, this.world.singleton.eid);
  }

  update(time: number, delta: number) {
    // @TODO remove this
    this.world.time = time
    this.world.delta = delta

    this.forEidIn(timeQuery, (eid)=> {
      TimeComponent.time[eid] = time
      TimeComponent.delta[eid] = delta
    })
  }
}
