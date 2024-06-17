import { IWorld, addComponent } from "bitecs"
import { BaseSystem } from "./baseSystem"
import { MouseDoubleClickComponent, MousePositionComponent } from "src/components/mouseComponent";
import { SingletonWorld } from "./singletonSystem";
import { TimeComponent } from "src/components/timeComponent";
import { WorldPositionComponent } from "src/components/positionComponent";

const DOUBLE_CLICK_THRESHOLD = 500 // in ms

export class MouseSystem<WorldIn extends SingletonWorld> extends BaseSystem<SingletonWorld, WorldIn, IWorld> {

  createWorld(worldIn: SingletonWorld): IWorld {
    return worldIn
  }

  update(_time: number, _delta: number) {
    // Must use the singleton eid
    const eid = this.world.singleton.eid
    
    // Mouse Position handling
    MousePositionComponent.x[eid] = this.scene.input.mousePointer.x
    MousePositionComponent.y[eid] = this.scene.input.mousePointer.y
    WorldPositionComponent.x[eid] = this.scene.input.mousePointer.worldX
    WorldPositionComponent.y[eid] = this.scene.input.mousePointer.worldY

    // Double-click handling
    // Note: Phaser's leftButtonReleased() function doesn't work and always report true
    let isDoubleClick = false
    const isLeftButtonDownNow = this.scene.input.mousePointer.leftButtonDown()
    if (MouseDoubleClickComponent._wasLeftButtonDownLastTick[eid]) {
      if (!isLeftButtonDownNow) {
        const currentTime = TimeComponent.time[eid];
        this.debug('Left Btn Released time=' + currentTime);
        
        if (MouseDoubleClickComponent._leftButtonReleaseTime[eid] + DOUBLE_CLICK_THRESHOLD > currentTime) {
          // double-click occurred
          this.debug('Double-click');
          isDoubleClick = true
        }
        // Update time since button was released
        MouseDoubleClickComponent._leftButtonReleaseTime[eid] = currentTime
      }
    }
    MouseDoubleClickComponent._wasLeftButtonDownLastTick[eid] = isLeftButtonDownNow ? 1 : 0
    MouseDoubleClickComponent.isDoubleClick[eid] = isDoubleClick ? 1 : 0
  }

  create() {

    // Disable browswer default right button context menu
    this.scene.input.mouse?.disableContextMenu()

    // Must use the singleton eid
    const eid = this.world.singleton.eid
    addComponent(this.world, MousePositionComponent, eid)
    MousePositionComponent.x[eid] = this.scene.input.mousePointer.x
    MousePositionComponent.y[eid] = this.scene.input.mousePointer.y

    // Mouse pointer also has a world position, re-use WorldPosition component for it
    addComponent(this.world, WorldPositionComponent, eid)
    WorldPositionComponent.x[eid] = this.scene.input.mousePointer.worldX
    WorldPositionComponent.y[eid] = this.scene.input.mousePointer.worldY

    // Mouse should also have a tile position
    // addComponent(this.world, TilePositionComponent, eid)
    // TilePositionComponent.x[eid] = 0;
    // TilePositionComponent.y[eid] = 0;

    addComponent(this.world, MouseDoubleClickComponent, eid)
    MouseDoubleClickComponent._leftButtonReleaseTime[eid] = 0
    MouseDoubleClickComponent.isDoubleClick[eid] = 0
  }
}
  

