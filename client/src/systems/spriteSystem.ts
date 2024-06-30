import { SpriteComponent } from 'src/components/spriteComponent'
import { BaseSystem } from './baseSystem'
import { IWorld, defineQuery, enterQuery, exitQuery, Not } from 'bitecs'
import {
  AngleComponent,
  VelocityComponent,
  WorldPositionComponent,
} from 'src/components/positionComponent'
import { TextureWorld } from './textureSystem'

export type SpriteWorld = {
  spriteWorld: {
    sprites: Map<number, Phaser.GameObjects.Sprite>
  }
}

const spriteNoVelocityQuery = defineQuery([
  SpriteComponent,
  WorldPositionComponent,
  Not(VelocityComponent),
])
const spriteWithVecityQuery = defineQuery([
  SpriteComponent,
  WorldPositionComponent,
  VelocityComponent,
])

export const MAX_ROTATION_SPEED = 4.0 // Radians per sec

export class SpriteSystem<WorldIn extends TextureWorld> extends BaseSystem<
  TextureWorld,
  WorldIn,
  SpriteWorld
> {
  // Define enter/exit queries locally so we don't accidentally share them
  private spriteEnterQuery = enterQuery(spriteNoVelocityQuery)
  private spriteExitQuery = exitQuery(spriteNoVelocityQuery)

  private spriteVelocityEnterQuery = enterQuery(spriteWithVecityQuery)
  private spriteVelocityExitQuery = exitQuery(spriteWithVecityQuery)

  createWorld(_worldIn: WorldIn) {
    const spriteWorld: SpriteWorld = {
      spriteWorld: {
        sprites: new Map(),
      },
    }
    return spriteWorld
  }

  preload(): void {}

  update(_time: number, delta: number) {
    const sprites = this.world.spriteWorld.sprites

    // Add sprites that have entered into the scene
    this.forEidIn(this.spriteEnterQuery, (eid) => {
      this._addSprite(eid)
    })
    this.forEidIn(this.spriteVelocityEnterQuery, (eid) => {
      this._addSprite(eid)
    })

    // Adjust max rotation based on tick
    const maxRotation = MAX_ROTATION_SPEED * 0.001 * delta

    // Update the world positions of the sprites
    this.forEidIn(spriteNoVelocityQuery, (eid) => {
      const sprite = sprites.get(eid)!
      this._updateSpritePosition(sprite, eid)
    })
    this.forEidIn(spriteWithVecityQuery, (eid) => {
      const sprite = sprites.get(eid)!
      this._updateSpritePosition(sprite, eid)
      // this._updateSpriteRotation(sprite, eid, maxRotation)
    })

    // @TODO User Groups ie Object Pools
    this.forEidIn(this.spriteExitQuery, (eid) => {
      this._removeSprite(eid)
    })
    this.forEidIn(this.spriteVelocityExitQuery, (eid) => {
      this._removeSprite(eid)
    })
  }

  _addSprite(eid: number) {
    const textInfo = this.world.textureWorld.textureManager.getTextureInfo(eid)
    const sprite = this.scene.add.sprite(0, 0, textInfo.key, textInfo.frame)
    if (textInfo.anchorX || textInfo.anchorY) {
      sprite.setOrigin(textInfo.anchorX, textInfo.anchorY)
    }

    this.world.spriteWorld.sprites.set(eid, sprite)

    // Update the sprite's width and height info
    SpriteComponent.width[eid] = sprite.width
    SpriteComponent.height[eid] = sprite.height
    return sprite
  }

  _updateSpritePosition(sprite: Phaser.GameObjects.Sprite, eid: number) {
    if (!sprite) {
      return
    }
    sprite.x = WorldPositionComponent.x[eid]
    sprite.y = WorldPositionComponent.y[eid]
  }

  // _updateSpriteRotation(sprite: Phaser.GameObjects.Sprite, eid: number, maxRotation: number) {
  //   const velocity = newVec2FromComp(VelocityComponent, eid)

  //   const desiredRotation = velocity.angle()
  //   let rotationDelta = desiredRotation - sprite.rotation
  //   rotationDelta = Phaser.Math.Angle.Wrap(rotationDelta)
  //   if (rotationDelta > 0) {
  //     rotationDelta = Math.min(maxRotation, rotationDelta)
  //   } else {
  //     rotationDelta = Math.max(-maxRotation, rotationDelta)
  //   }

  //   sprite.rotation = Phaser.Math.Angle.Wrap(sprite.rotation + rotationDelta)
  // }

  _removeSprite(eid: number) {
    this.world.spriteWorld.sprites.get(eid)?.destroy()
    this.world.spriteWorld.sprites.delete(eid)
    this.debug('Removing sprite ' + eid)
  }
}

const spriteAngleQuery = defineQuery([SpriteComponent, AngleComponent])
/**
 * If entity has angle, rotate it
 */
export class SpriteAngleSystem<WorldIn extends SpriteWorld> extends BaseSystem<
  SpriteWorld,
  WorldIn,
  IWorld
> {
  createWorld(_worldIn: WorldIn) {
    return {}
  }

  update() {
    const eids = spriteAngleQuery(this.world)
    eids.forEach((eid) => {
      const sprite = this.world.spriteWorld.sprites.get(eid)
      if (sprite === undefined) {
        return
      }
      sprite.rotation = AngleComponent.radians[eid]
    })
  }
}
