import { ASSETS_PATH } from 'src/constants'
import type { TiledTileSetJson } from './tiledTypes'

const TILES_PATH = ASSETS_PATH + '/tiles/inkscape'

/**
 * The file must be located in the /assets/tiles directory.
 * Call this in the preload() method of a Phaser scene using the rexAwait loader.
 *
 * @param tiledTileSetJsonFile
 * @returns Promise of the tileset json
 */
export const loadTiledTileSetJson = async (
  tiledTileSetJsonFile: string,
): Promise<TiledTileSetJson> => {
  const resp = await fetch(TILES_PATH + '/' + tiledTileSetJsonFile)
  const tiledJson: TiledTileSetJson = await resp.json()
  return tiledJson
}
