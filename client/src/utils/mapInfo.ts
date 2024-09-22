import { TileSetInfo } from 'src/mapping/tiledJsonParser'

export type MapInfo = {
  seed: number
  tileSetInfo?: TileSetInfo

  tileToWorldX: (x: number) => number
  tileToWorldY: (y: number) => number
  tileToWorldXY: (x: number, y: number, result?: Phaser.Math.Vector2) => Phaser.Math.Vector2
  worldToTileX: (x: number, snapToFloor?: boolean) => number
  worldToTileY: (y: number, snapToFloor?: boolean) => number
  worldToTileXY: (
    x: number,
    y: number,
    snapToFloor?: boolean,
    result?: Phaser.Math.Vector2,
  ) => Phaser.Math.Vector2
}

export const emptyMapInfo = (seed: number): MapInfo => {
  const throwError = () => {
    throw new Error(`Initialize TilesetInfo before calling this.`)
  }

  return {
    seed,
    tileToWorldX: throwError,
    tileToWorldY: throwError,
    tileToWorldXY: throwError,
    worldToTileX: throwError,
    worldToTileY: throwError,
    worldToTileXY: throwError,
  }
}

export const addTileSetInfo = (mapInfo: MapInfo, tileSetInfo: TileSetInfo): MapInfo => {
  return {
    ...mapInfo,
    tileSetInfo,
    tileToWorldX: (x: number) => tileSetInfo.tileWidth * x,
    tileToWorldY: (y: number) => tileSetInfo.tileHeight * y,

    tileToWorldXY: (x: number, y: number, result?: Phaser.Math.Vector2) => {
      if (!result) {
        result = new Phaser.Math.Vector2()
      }
      result.x = tileSetInfo.tileWidth * x
      result.y = tileSetInfo.tileHeight * y
      return result
    },

    worldToTileX: (x: number) => Math.floor(x / tileSetInfo.tileWidth),
    worldToTileY: (y: number) => Math.floor(y / tileSetInfo.tileHeight),

    worldToTileXY: (x: number, y: number, snapToFloor?: boolean, result?: Phaser.Math.Vector2) => {
      if (!result) {
        result = new Phaser.Math.Vector2()
      }
      result.x = x / tileSetInfo.tileWidth
      result.y = y / tileSetInfo.tileHeight
      if (snapToFloor) {
        result.x = Math.floor(result.x)
        result.y = Math.floor(result.y)
      }
      return result
    },
  }
}
