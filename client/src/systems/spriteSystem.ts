import { SpriteComponent } from 'src/components/spriteComponent'
import { BaseSystem } from './baseSystem'
import { Types, IWorld, defineQuery, enterQuery, exitQuery, Not } from 'bitecs'
import {
  AngleComponent,
  VelocityComponent,
  WorldPositionComponent,
} from 'src/components/positionComponent'
import { useTheme } from 'styled-components'
import { newVec2FromComp } from 'src/utils/vectors'

export type SpriteWorld = {
  sprites: Map<number, Phaser.GameObjects.Sprite>
}

export type SpriteSheetInfo = {
  imagePath: string
  jsonPath: string
  key: string
  idToName: (id: number) => string
  nameToId: (name: string) => number
}

export const SPRITE_CHARACTERS = [
  'hitman1',
  'manBlue',
  'manBrown',
  'manOld',
  'robot1',
  'soldier1',
] as const
export type SpriteCharacter = typeof SPRITE_CHARACTERS[number]
export const SPRITE_STATES = ['gun', 'hold', 'machine', 'reload', 'silencer', 'stand'] as const
export type SpriteState = typeof SPRITE_STATES[number]
export type SpriteName = `${SpriteCharacter}_${SpriteState}.png`
export const SPRITE_ID_TO_NAME_MAP = new Map<number, SpriteName>()
export type k = keyof typeof SPRITE_CHARACTERS

let spriteId = 0
SPRITE_CHARACTERS.forEach((character) => {
  SPRITE_STATES.forEach((state) => {
    const name: SpriteName = `${character}_${state}.png`
    SPRITE_ID_TO_NAME_MAP.set(spriteId++, name)
  })
})

export const SPRITE_NAME_TO_ID_MAP = new Map<string, number>()
Array.from(SPRITE_ID_TO_NAME_MAP.entries()).forEach(([id, spriteName]) => {
  SPRITE_NAME_TO_ID_MAP.set(spriteName, id)
})

function pad(numToPad: number, size: number) {
  let num = numToPad.toString()
  while (num.length < size) num = '0' + num
  return num
}

const CROSSHAIR_INFO: SpriteSheetInfo = {
  imagePath: 'assets/sprites/crosshair/crosshairsheet.png',
  jsonPath: 'assets/sprites/crosshair/crosshair.json',
  key: 'crosshair',
  idToName: (id) => {
    return `crosshair${pad(id, 3)}.png`
  },
  nameToId: (name) => {
    return parseInt(name.slice(9, 12), 10)
  },
}

const SHOOTER_INFO: SpriteSheetInfo = {
  imagePath: 'assets/sprites/shooter/shooter.png',
  jsonPath: 'assets/sprites/shooter/shooter.json',
  key: 'shooter',
  idToName: (id) => {
    return SPRITE_ID_TO_NAME_MAP.get(id) ?? ''
  },
  nameToId: (name) => {
    return SPRITE_NAME_TO_ID_MAP.get(name) ?? 0
  },
}

const SHEET_INFOS: SpriteSheetInfo[] = [SHOOTER_INFO, CROSSHAIR_INFO]

export const SPRITE_KEYS = SHEET_INFOS.map((info) => info.key)

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

export class SpriteSystem<WorldIn extends IWorld> extends BaseSystem<IWorld, WorldIn, SpriteWorld> {
  // Define enter/exit queries locally so we don't accidentally share them
  private spriteEnterQuery = enterQuery(spriteNoVelocityQuery)
  private spriteExitQuery = exitQuery(spriteNoVelocityQuery)

  private spriteVelocityEnterQuery = enterQuery(spriteWithVecityQuery)
  private spriteVelocityExitQuery = exitQuery(spriteWithVecityQuery)

  createWorld(_worldIn: WorldIn) {
    const spriteWorld: SpriteWorld = {
      sprites: new Map(),
    }
    return spriteWorld
  }

  preload(): void {
    SHEET_INFOS.forEach((info) => {
      this.scene.load.atlas(info.key, info.imagePath, info.jsonPath)
    })
  }

  update(_time: number, delta: number) {
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
      const sprite = this.world.sprites.get(eid)!
      this._updateSpritePosition(sprite, eid)
    })
    this.forEidIn(spriteWithVecityQuery, (eid) => {
      const sprite = this.world.sprites.get(eid)!
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
    const spriteId = SpriteComponent.spriteId[eid]
    const spriteKey = SpriteComponent.spriteKey[eid]
    const info = SHEET_INFOS[spriteKey]
    const spriteName = info.idToName(spriteId)
    const sprite = this.scene.add.sprite(0, 0, info.key, spriteName)
    this.world.sprites.set(eid, sprite)
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
    this.world.sprites.get(eid)?.destroy()
    this.world.sprites.delete(eid)
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
      const sprite = this.world.sprites.get(eid)
      if (sprite === undefined) {
        return
      }
      sprite.rotation = AngleComponent.radians[eid]
    })
  }
}
