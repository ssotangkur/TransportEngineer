import { SpriteComponent } from 'src/components/spriteComponent'
import { BaseSystem } from './baseSystem'
import { Types, IWorld, defineQuery, enterQuery, exitQuery } from 'bitecs'
import { AngleComponent, WorldPositionComponent } from 'src/components/positionComponent'
import { useTheme } from 'styled-components'

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

const spriteQuery = defineQuery([SpriteComponent, WorldPositionComponent])

export class SpriteSystem<WorldIn extends IWorld> extends BaseSystem<IWorld, WorldIn, SpriteWorld> {
  // Define enter/exit queries locally so we don't accidentally share them
  private spriteEnterQuery = enterQuery(spriteQuery)
  private spriteExitQuery = exitQuery(spriteQuery)

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

  update(_time: number, _delta: number) {
    // Add sprites that have entered into the scene
    const enteringEids = this.spriteEnterQuery(this.world)
    enteringEids.forEach((eid) => {
      const spriteId = SpriteComponent.spriteId[eid]
      const spriteKey = SpriteComponent.spriteKey[eid]
      const info = SHEET_INFOS[spriteKey]
      const spriteName = info.idToName(spriteId)
      const sprite = this.scene.add.sprite(0, 0, info.key, spriteName)
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
    const exitingEids = this.spriteExitQuery(this.world)
    exitingEids.forEach((eid) => {
      this.world.sprites.get(eid)?.destroy()
      this.world.sprites.delete(eid)
      console.log('Removing sprite' + eid)
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
