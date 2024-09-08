import { Changed, IWorld, defineQuery } from 'bitecs'
import { BaseSystem } from './baseSystem'
import { MapWorld } from './mapSystem'

import { DebugMapComponent, DebugMapMode, DebugMapModes } from 'src/components/debugMapComponent'
import { Biome, BiomeCell } from 'src/mapping/biome'
import { TileSetInfo } from 'src/mapping/tiledJsonParser'

const mapDebugChangedQuery = defineQuery([Changed(DebugMapComponent)])

export class DebugMapSystem<WorldIn extends MapWorld> extends BaseSystem<
  MapWorld,
  WorldIn,
  IWorld
> {
  private renderTextures: Phaser.GameObjects.RenderTexture[] = []
  private created: boolean = false

  createWorld(_worldIn: IWorld): IWorld {
    return {}
  }

  private forEachRenderTexture(
    mapFunc: (key: DebugMapModes, value: Phaser.GameObjects.RenderTexture, index: number) => void,
  ) {
    this.renderTextures.forEach((rt, index) => mapFunc(index as DebugMapModes, rt, index))
  }

  preload(): void {
    this.subUnsub('mapUpdated', () => {
      this.onMapUpdated()
    })
  }

  create(): void {
    if (this.created) {
      return
    }
    Object.values(DebugMapMode).forEach((mode) => {
      if (mode === DebugMapMode.Off) {
        return
      }
      this.renderTextures[mode] = this.scene.add
        .renderTexture(0, 0)
        .setVisible(false)
        .setDepth(10000)
    })
    this.created = true
  }

  update() {
    const biomeMap = this.world.mapSystem.biomeMap
    const map = this.world.mapSystem.map
    const tileSetInfo = this.world.mapSystem.tileSetInfo
    if (!biomeMap || !map || !tileSetInfo) {
      return
    }

    let mode: DebugMapModes = DebugMapMode.Off
    this.forEidIn(mapDebugChangedQuery, (eid) => {
      mode = DebugMapComponent.mode[eid] as DebugMapModes

      this.forEachRenderTexture((_, rt) => {
        rt.setVisible(false)
      })

      if (mode === DebugMapMode.Off) {
        return
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

      this.renderTextures[mode].setVisible(true)
      // this.text.push(this.scene.add.text(10, 10, text, { color: 'white' }).setDepth(10000))
    })
  }

  private onMapUpdated() {
    console.log('Map updated')

    this.create() // MapSystem may call us before we get a chance to create()

    const biomeMap = this.world.mapSystem.biomeMap
    if (!biomeMap) {
      this.debug('No biomeMap, exiting')
      return
    }
    const width = biomeMap[0].length
    const height = biomeMap.length

    const scaleX = this.world.mapSystem.tileSetInfo!.tileWidth
    const scaleY = this.world.mapSystem.tileSetInfo!.tileHeight

    this.forEachRenderTexture((mode, rt) => {
      rt.setScale(scaleX, scaleY)
      rt.setSize(width, height)
      rt.setPosition((width / 2) * scaleX - scaleX / 2, (height / 2) * scaleY - scaleY / 2)
      rt.clear()

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

      for (let r = 0; r < biomeMap.length; r++) {
        for (let c = 0; c < biomeMap[r].length; c++) {
          const cell = biomeMap[r][c]
          // const worldPos = map.tileToWorldXY(c, r)!
          const color = getColor(cell)
          rt.fill(color, undefined, c, r, 1, 1)
        }
      }
    })
  }

  // private clearGameObjects() {
  //   for (let i = 0; i < this.gameObjs.length; i++) {
  //     const obj = this.gameObjs[i]
  //     obj.destroy()
  //   }
  //   this.gameObjs = []
  // }
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