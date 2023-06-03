import { IWorld, addComponent, defineQuery, removeComponent } from 'bitecs'
import { BaseSystem } from './baseSystem'
import { TextureManager } from 'src/utils/textureManager'
import { DeferredRingTextureCreationComponent } from 'src/components/groupComponent'
import { SpriteComponent } from 'src/components/spriteComponent'

export type TextureWorld = {
  textureWorld: {
    textureManager: TextureManager
  }
}

/**
 * This just maintains the texture manager
 */
export class TextureSystem<WorldIn extends IWorld> extends BaseSystem<
  IWorld,
  WorldIn,
  TextureWorld
> {
  private deferredComponentQuery = defineQuery([DeferredRingTextureCreationComponent])

  createWorld(worldIn: IWorld) {
    return {
      textureWorld: {
        textureManager: new TextureManager(worldIn, this.scene),
      },
    }
  }

  preload() {
    this.world.textureWorld.textureManager.preload()
  }

  update() {
    // test every deferred to see if we can get the radius now
    this.forEidIn(this.deferredComponentQuery, (eid) => {
      const refEid = DeferredRingTextureCreationComponent.refEid[eid]
      const radius = Math.max(SpriteComponent.height[refEid], SpriteComponent.width[refEid]) / 2
      if (radius === 0) {
        return
      }
      const texInfo = this.world.textureWorld.textureManager._getOrCreateRingTexture(
        radius,
        DeferredRingTextureCreationComponent.color[eid],
        DeferredRingTextureCreationComponent.lineWidth[eid],
      )
      addComponent(this.world, SpriteComponent, eid)
      SpriteComponent.spriteId[eid] = 0
      SpriteComponent.spriteKey[eid] = texInfo.index
      // now remove Deferred component
      removeComponent(this.world, DeferredRingTextureCreationComponent, eid)
    })
  }
}
