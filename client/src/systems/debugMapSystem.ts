import { Changed, IWorld, defineQuery } from 'bitecs'
import { BaseSystem } from './baseSystem'
import { MapWorld } from './mapSystem'

import { DebugMapComponent, DebugMapMode } from 'src/components/debugMapComponent'
import { Biome, BiomeCell } from 'src/mapping/biome'
import { TileSetInfo } from 'src/mapping/tiledJsonParser'

const mapDebugChangedQuery = defineQuery([Changed(DebugMapComponent)])

export class DebugMapSystem<WorldIn extends MapWorld> extends BaseSystem<
  MapWorld,
  WorldIn,
  IWorld
> {
  private gameObjs: Phaser.GameObjects.GameObject[] = []

  createWorld(_worldIn: IWorld): IWorld {
    return {}
  }

  update() {
    const biomeMap = this.world.mapSystem.biomeMap
    const map = this.world.mapSystem.map
    const tileSetInfo = this.world.mapSystem.tileSetInfo
    if (!biomeMap || !map || !tileSetInfo) {
      return
    }

    let mode: number = DebugMapMode.Off
    this.forEidIn(mapDebugChangedQuery, (eid) => {
      mode = DebugMapComponent.mode[eid]

      this.clearGameObjects()
      if (mode !== DebugMapMode.Off) {
        this.initializeRects(biomeMap, map, tileSetInfo, mode)
      }
    })
  }

  private initializeRects(
    biomeMap: BiomeCell[][],
    map: Phaser.Tilemaps.Tilemap,
    tileSetInfo: TileSetInfo,
    mode: number,
  ) {
    const getColor = (cell: BiomeCell) => {
      switch (mode) {
        case DebugMapMode.HeightMap:
          return Phaser.Display.Color.GetColor(cell.height * 255, 0, 0)
        case DebugMapMode.PrecipitationMap:
          return Phaser.Display.Color.GetColor(0, 0, cell.precipitation * 255)
        case DebugMapMode.TemperatureMap:
          return Phaser.Display.Color.GetColor(0, cell.temperature * 255, 0)
        case DebugMapMode.Biome:
          return getColorForBiome(cell.biome)
        default:
          throw new Error(`Invalid mode ${mode}`)
      }
    }

    const width = tileSetInfo.tileWidth
    const halfWidth = width / 2
    const height = tileSetInfo.tileHeight
    const halfHeight = height / 2

    for (let r = 0; r < biomeMap.length; r++) {
      for (let c = 0; c < biomeMap[r].length; c++) {
        const cell = biomeMap[r][c]
        const worldPos = map.tileToWorldXY(c, r)!
        const color = getColor(cell)
        const rect = this.scene.add
          .rectangle(worldPos.x - halfWidth, worldPos.y - halfHeight, width, height, color)
          .setOrigin(0, 0)
          .setDepth(10000)
        this.gameObjs.push(rect)
      }
    }

    let text = ''
    switch (mode) {
      case DebugMapMode.HeightMap:
        text = 'Height Map'
        break
      case DebugMapMode.PrecipitationMap:
        text = 'Precipitation Map'
        break
      case DebugMapMode.TemperatureMap:
        text = 'Temperature Map'
        break
      case DebugMapMode.Biome:
        text = 'Biome Map'
        break
      default:
        throw new Error(`Invalid mode ${mode}`)
    }
    this.gameObjs.push(this.scene.add.text(10, 10, text, { color: 'white' }).setDepth(10000))
  }

  private clearGameObjects() {
    for (let i = 0; i < this.gameObjs.length; i++) {
      const obj = this.gameObjs[i]
      obj.destroy()
    }
    this.gameObjs = []
  }
}

const getColorForBiome = (biome: Biome) => {
  let color = '#0000ff'
  switch (biome) {
    case 'ocean':
      color = '#0000ff'
      break
    case 'desert':
      color = '#ffffcc'
      break
    case 'grassland':
      color = '#73e600'
      break
    case 'forest':
      color = '#006600'
      break
    case 'taiga':
      color = '#993399'
      break
    case 'tundra':
      color = '#ccffff'
      break
    case 'jungle':
      color = '#bafc03'
      break
    default:
      throw new Error(`Invalid biome ${biome}`)
  }

  return Phaser.Display.Color.ValueToColor(color).color
}
