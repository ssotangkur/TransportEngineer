import { SpriteComponent } from 'src/components/spriteComponent'
import { BaseSystem } from './baseSystem'
import { Types, IWorld, defineQuery, enterQuery, exitQuery } from 'bitecs'
import { WorldPositionComponent } from 'src/components/positionComponent'
import { useTheme } from 'styled-components'

export type SpriteWorld = {
  sprites: Map<number, Phaser.GameObjects.Sprite>
}

const SHOOTER_IMAGE_PATH = 'assets/sprites/shooter.png'
const SHOOTER_JSON_PATH = 'assets/sprites/shooter.json'

const SPRITES_ID = 'sprites'

export const SPRITE_CHARACTERS = ['hitman1', 'manBlue', 'manBrown', 'manOld', 'robot1'] as const
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

const spriteQuery = defineQuery([SpriteComponent, WorldPositionComponent])
const spriteEnterQuery = enterQuery(spriteQuery)
const spriteExitQuery = exitQuery(spriteQuery)

export class SpriteSystem<WorldIn extends IWorld> extends BaseSystem<WorldIn, SpriteWorld> {
  createWorld(worldIn: WorldIn) {
    const spriteWorld: SpriteWorld = {
      sprites: new Map(),
    }
    return this.mergeWorlds(worldIn, spriteWorld)
  }

  preload(): void {
    this.scene.load.atlas(SPRITES_ID, SHOOTER_IMAGE_PATH, SHOOTER_JSON_PATH)
  }

  update(time: number, delta: number) {
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
