import { SpriteComponent } from 'src/components/spriteComponent'
import { BaseSystem } from './baseSystem'
import { Types, IWorld, defineQuery, enterQuery, exitQuery } from 'bitecs'
import { AngleComponent, WorldPositionComponent } from 'src/components/positionComponent'
import { useTheme } from 'styled-components'

export type SpriteWorld = {
  sprites: Map<number, Phaser.GameObjects.Sprite>
}

const SHOOTER_IMAGE_PATH = 'assets/sprites/shooter.png'
const SHOOTER_JSON_PATH = 'assets/sprites/shooter.json'

const SPRITES_ID = 'sprites'

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

export const SPRITE_NAME_TO_ID_MAP = new Map<SpriteName, number>()
Array.from(SPRITE_ID_TO_NAME_MAP.entries()).forEach(([id, spriteName]) => {
  SPRITE_NAME_TO_ID_MAP.set(spriteName, id)
})

const spriteQuery = defineQuery([SpriteComponent, WorldPositionComponent])
const spriteEnterQuery = enterQuery(spriteQuery)
const spriteExitQuery = exitQuery(spriteQuery)

export class SpriteSystem<WorldIn extends IWorld> extends BaseSystem<IWorld, WorldIn, SpriteWorld> {
  createWorld(_worldIn: WorldIn) {
    const spriteWorld: SpriteWorld = {
      sprites: new Map(),
    }
    return spriteWorld
  }

  preload(): void {
    this.scene.load.atlas(SPRITES_ID, SHOOTER_IMAGE_PATH, SHOOTER_JSON_PATH)
  }

  update(_time: number, _delta: number) {
    // Add sprites that have entered into the scene
    const enteringEids = spriteEnterQuery(this.world)
    enteringEids.forEach((eid) => {
      const spriteId = SpriteComponent.spriteId[eid]
      const spriteName = SPRITE_ID_TO_NAME_MAP.get(spriteId)
      const sprite = this.scene.add.sprite(0, 0, SPRITES_ID, spriteName)
      this.world.sprites.set(eid, sprite)
    })

    // Update the world positions of the sprites
    const eids = spriteQuery(this.world)
    eids.forEach((eid) => {
      const sprite = this.world.sprites.get(eid)
      if (!sprite) {
        return
      }
      sprite.x = WorldPositionComponent.x[eid]
      sprite.y = WorldPositionComponent.y[eid]
    })

    // @TODO User Groups ie Object Pools
    const exitingEids = spriteExitQuery(this.world)
    exitingEids.forEach((eid) => {
      this.world.sprites.get(eid)?.destroy()
      this.world.sprites.delete(eid)
    })
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
