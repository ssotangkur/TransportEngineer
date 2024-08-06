import { describe, it } from 'vitest'
import { createHeightMap, normalize2DArray } from './noiseGeneratedMap'

describe('noiseGeneratedMap', () => {
  it('makes height map', () => {
    const result = createHeightMap(100, 100)

    normalize2DArray(result)

    console.log(result)
  })
})
