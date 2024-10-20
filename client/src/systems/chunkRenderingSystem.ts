import { defineQuery, enterQuery, exitQuery, IWorld } from 'bitecs'
import { ChunkComponent } from 'src/components/chunkComponent'
import { BaseSystem } from './baseSystem'
import { MapWorld } from './mapSystem'
import { SingletonWorld } from './singletonSystem'
import {
  initializePhaserTileMap,
  updateMapDataFromMultiLayerMap,
} from 'src/mapping/tiledJsonParser'
import { CHUNK_SIZE } from 'src/constants'
import { chunkKey } from './chunkVisibilitySystem'
import { generateMapDataUsingNoise } from 'src/mapping/mapGenerator'

const chunkQuery = defineQuery([ChunkComponent])
const chunkEnter = enterQuery(chunkQuery)
const chunkExit = exitQuery(chunkQuery)

/**
 * Monitors the camera's view and creates or removes chunk entities based on what is visible
 * on screen.
 */
export class ChunkRenderingSystem<WorldIn extends MapWorld & SingletonWorld> extends BaseSystem<
  MapWorld & SingletonWorld,
  WorldIn,
  IWorld
> {
  private chunkKeyToMapMap: Map<string, Phaser.Tilemaps.Tilemap> = new Map()

  createWorld(worldIn: MapWorld & SingletonWorld): IWorld {
    return worldIn
  }

  create(): void {}

  update(_time: number, _delta: number): void {
    const tileSetInfo = this.world.mapSystem.tileSetInfo
    const colorMap = this.world.mapSystem.colorMap
    if (!tileSetInfo || !colorMap) {
      return
    }

    this.forEidIn(chunkEnter, (eid) => {
      const chunkX = ChunkComponent.x[eid]
      const chunkY = ChunkComponent.y[eid]
      const key = chunkKey(chunkX, chunkY)

      const offsetTileX = chunkX * CHUNK_SIZE
      const offsetTileY = chunkY * CHUNK_SIZE

      const offsetWorldX = offsetTileX * tileSetInfo.tileWidth
      const offsetWorldY = offsetTileY * tileSetInfo.tileHeight

      const map = initializePhaserTileMap(
        CHUNK_SIZE,
        CHUNK_SIZE,
        tileSetInfo,
        this.scene,
        offsetWorldX,
        offsetWorldY,
      )
      this.chunkKeyToMapMap.set(key, map)

      // Translate coordinates of biomeMap by offset
      const translatedColorMap = (r: number, c: number) => {
        return colorMap(r + offsetTileY, c + offsetTileX)
      }

      const { multiLayerMap } = generateMapDataUsingNoise(
        CHUNK_SIZE,
        CHUNK_SIZE,
        tileSetInfo,
        translatedColorMap,
      )

      updateMapDataFromMultiLayerMap(CHUNK_SIZE, CHUNK_SIZE, map, multiLayerMap)
    })

    this.forEidIn(chunkExit, (eid) => {
      const key = chunkKey(ChunkComponent.x[eid], ChunkComponent.y[eid])

      const map = this.chunkKeyToMapMap.get(key)
      if (!map) {
        return
      }
      this.chunkKeyToMapMap.delete(key)
      map.destroy()
    })
  }
}
