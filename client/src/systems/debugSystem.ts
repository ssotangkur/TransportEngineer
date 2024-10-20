import { IWorld, defineQuery, enterQuery, exitQuery } from 'bitecs'
import { BaseSystem } from './baseSystem'
import { PlayerComponent } from 'src/components/playerComponent'
import {
  AccelerationComponent,
  TilePositionComponent,
  TileTargetComponent,
  VelocityComponent,
} from 'src/components/positionComponent'
import { AccelVizComponent } from 'src/components/debugComponent'
import { MapWorld } from './mapSystem'
import { newVec2FromComp, setVec2FromComp } from 'src/utils/vectors'

const debugQuery = defineQuery([PlayerComponent, TileTargetComponent])

export class DebugSystem<WorldIn extends IWorld> extends BaseSystem<IWorld, WorldIn, IWorld> {
  createWorld(_worldIn: IWorld): IWorld {
    return {}
  }

  update() {
    this.forEidIn(debugQuery, (eid) => {
      this.debug(`Target x=${TileTargetComponent.x[eid]} y=${TileTargetComponent.y[eid]}`)
    })
  }
}

export type AccelVizWorld = {
  accelVizWorld: {
    lines: Map<number, Phaser.GameObjects.Line>
  }
}
export class AccelVizSystem<WorldIn extends MapWorld> extends BaseSystem<
  MapWorld,
  WorldIn,
  AccelVizWorld
> {
  private accelVizQuery = defineQuery([
    AccelVizComponent,
    AccelerationComponent,
    TilePositionComponent,
  ])
  private accelVizEnter = enterQuery(this.accelVizQuery)
  private accelVizExit = exitQuery(this.accelVizQuery)

  // Temp Vec2's to avoid GC
  private start = new Phaser.Math.Vector2()
  private accel = new Phaser.Math.Vector2()

  createWorld(_worldIn: IWorld): AccelVizWorld {
    return {
      accelVizWorld: {
        lines: new Map(),
      },
    }
  }

  update() {
    this.forEidIn(this.accelVizEnter, (eid) => {
      const line = this.scene.add.line(0, 0, 0, 0, 0, 0, 0xff0000)
      this.world.accelVizWorld.lines.set(eid, line)
    })

    // Temp Vec2's so we don't 

    this.forEidIn(this.accelVizQuery, (eid) => {
      setVec2FromComp(this.start, TilePositionComponent, eid)
      setVec2FromComp(this.accel, VelocityComponent, eid)
      let end = this.accel.add(this.start)
      this.world.mapSystem.mapInfo.tileToWorldXY(this.start.x, this.start.y, this.start)
      this.world.mapSystem.mapInfo.tileToWorldXY(end.x, end.y, end)
      const line = this.world.accelVizWorld.lines.get(eid)
      line?.setOrigin(0, 0)
      line?.setTo(this.start.x, this.start.y, end.x, end.y)
    })

    this.forEidIn(this.accelVizExit, (eid) => {
      this.world.accelVizWorld.lines.delete(eid)
    })
  }
}
