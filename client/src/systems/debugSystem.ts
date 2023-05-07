import { IWorld, defineQuery } from 'bitecs'
import { BaseSystem } from './baseSystem'
import { PlayerComponent } from 'src/components/playerComponent'
import { TileTargetComponent } from 'src/components/positionComponent'

const debugQuery = defineQuery([PlayerComponent, TileTargetComponent])

export class DebugSystem<WorldIn extends IWorld> extends BaseSystem<IWorld, WorldIn, IWorld> {
  createWorld(_worldIn: IWorld): IWorld {
    return {}
  }

  update() {
    this.forEidIn(debugQuery, (eid) => {
      console.log(`Target x=${TileTargetComponent.x[eid]} y=${TileTargetComponent.y[eid]}`)
    })
  }
}
