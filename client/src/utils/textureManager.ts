import { IWorld, addComponent } from 'bitecs'
import { DeferredRingTextureCreationComponent } from 'src/components/groupComponent'
import { SpriteComponent } from 'src/components/spriteComponent'

export type SpriteSheetInfo = {
  type: 'spritesheet'
  key: string
  index: number
  imagePath: string
  jsonPath: string
  idToName: (id: number) => string
  nameToId: (name: string) => number
}

export type DynamicTextureInfo = {
  type: 'dynamicTexture'
  key: string
  index: number
  anchorX: number
  anchorY: number
}

export type TexturePackInfo = SpriteSheetInfo | DynamicTextureInfo

/**
 * Info about a specific texture that can be applied to a sprite.
 */
export type TextureInfo = {
  key: string
  frame?: string
  anchorX?: number
  anchorY?: number
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

function pad(numToPad: number | string, size: number) {
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
  type: 'spritesheet',
  index: 0,
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
  type: 'spritesheet',
  index: 0,
}
export const PLAYER_SELECT_RING_KEY = 'playerSelectRing'

const RING_INFO: DynamicTextureInfo = {
  key: PLAYER_SELECT_RING_KEY,
  type: 'dynamicTexture',
  anchorX: 0.5,
  anchorY: 0.5,
  index: 0,
}

const TEXTURE_INFOS: TexturePackInfo[] = [SHOOTER_INFO, CROSSHAIR_INFO, RING_INFO]

function addTextureInfo(texInfo: TexturePackInfo) {
  TEXTURE_INFOS.push(texInfo)
  // Update the index
  texInfo.index = TEXTURE_INFOS.indexOf(texInfo)
  keyInfoMap.set(texInfo.key, texInfo)
}

// Id's for Keys
export const RING_KEY_ID = TEXTURE_INFOS.indexOf(RING_INFO)
const keyInfoMap = new Map<string, TexturePackInfo>(TEXTURE_INFOS.map((info) => [info.key, info]))

/**
 * Textures come from many places
 *
 * This class helps to sort everything related to textures out
 */
export class TextureManager {
  constructor(private world: IWorld, private scene: Phaser.Scene) {}

  // Call this load textures
  preload() {
    TEXTURE_INFOS.forEach((info) => {
      if (info.type === 'spritesheet') {
        this.scene.load.atlas(info.key, info.imagePath, info.jsonPath)
      }
    })
  }

  create() {}

  _ringKey(radius: number, color: number, lineWidth: number) {
    return `ring-${radius}-${pad(color.toString(16), 6)}-${lineWidth}`
  }

  _getOrCreateRingTexture(radius: number, color: number, lineWidth: number = 1, alpha?: number) {
    console.debug('GetOrCreateRing')

    const key = this._ringKey(radius, color, lineWidth)
    const texInfoCached = keyInfoMap.get(key)
    if (texInfoCached) {
      return texInfoCached
    }

    const graphics = this.scene.add.graphics({ x: radius, y: radius })
    graphics.lineStyle(lineWidth, color, alpha)
    var circle = new Phaser.Geom.Circle(radius, radius, radius)
    graphics.strokeCircleShape(circle)

    const texInfo: DynamicTextureInfo = {
      key,
      index: 0,
      type: 'dynamicTexture',
      anchorX: 0.5,
      anchorY: 0.5,
    }
    graphics.generateTexture(key, radius * 2, radius * 2)
    graphics.destroy()
    addTextureInfo(texInfo)
    return texInfo
  }

  /**
   * Returns a tuple for the texture key and frame string (if available) as needed by
   * the last 2 args of scene.add.sprite(x,y, ...)
   */
  getTextureInfo(eid: number): TextureInfo {
    const spriteId = SpriteComponent.spriteId[eid]
    const spriteKey = SpriteComponent.spriteKey[eid]
    const info = TEXTURE_INFOS[spriteKey]
    const result: TextureInfo = {
      key: info.key,
    }

    if (info.type === 'spritesheet') {
      result.frame = info.idToName(spriteId)
    } else {
      result.anchorX = info.anchorX
      result.anchorY = info.anchorY
    }

    return result
  }

  setPlayerTexture(eid: number) {
    addComponent(this.world, SpriteComponent, eid)
    SpriteComponent.spriteId[eid] = SPRITE_NAME_TO_ID_MAP.get('soldier1_gun.png') ?? 0
    SpriteComponent.spriteKey[eid] = 0
  }

  setShooterTexture(eid: number) {
    addComponent(this.world, SpriteComponent, eid)
    SpriteComponent.spriteId[eid] = 10
    SpriteComponent.spriteKey[eid] = 0
  }

  /**
   * Sets the ring texture on the entity eid,
   * The size of the ring comes from the reference eid
   * @param eid
   * @param refEid
   */
  setRingTexture(eid: number, refEid: number, color: number = 0x00ff00, lineWidth: number = 1) {
    // Determine radius from refEid
    const radius = Math.max(SpriteComponent.height[refEid], SpriteComponent.width[refEid]) / 2
    if (radius === 0) {
      // Sprite hasn't been loaded yet, defer creating texture till it is
      addComponent(this.world, DeferredRingTextureCreationComponent, eid)
      DeferredRingTextureCreationComponent.color[eid] = color
      DeferredRingTextureCreationComponent.lineWidth[eid] = lineWidth
      DeferredRingTextureCreationComponent.refEid[eid] = refEid
      return
    }

    const texInfo = this._getOrCreateRingTexture(radius, color, lineWidth)
    addComponent(this.world, SpriteComponent, eid)
    SpriteComponent.spriteId[eid] = 0
    SpriteComponent.spriteKey[eid] = texInfo.index
  }
}
