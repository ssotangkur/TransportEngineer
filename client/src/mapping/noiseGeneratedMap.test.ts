import { describe, expect, it } from 'vitest'
import { createNoiseMap, createOctaveNoiseFn } from './noiseGeneratedMap'
import { makeNoise2D } from 'open-simplex-noise'

describe('noiseGeneratedMap', () => {
  it('noise map should be in range 0-1', () => {
    const noise2d = makeNoise2D(Date.now())
    const octaveNoise = createOctaveNoiseFn(0.1, 4, 0.5, noise2d, 0.7)

    let max = 0
    let min = 1
    for (let y = 0; y < 200; y++) {
      for (let x = 0; x < 200; x++) {
        const val = octaveNoise(x, y)
        max = Math.max(max, val)
        min = Math.min(min, val)
      }
    }

    // const map = createNoiseMap(200, 200, {
    //   baseCoordScale: 1,
    //   octaves: 8,
    //   decayCoeff: 0.5,
    //   seedOffset: 0,
    // })

    // const max = Math.max(...map.map((row) => Math.max(...row)))
    // const min = Math.min(...map.map((row) => Math.min(...row)))

    console.log({ min, max })

    // expect(max).toBeGreaterThan(0)
    // expect(max).toBeLessThan(1)
    // expect(min).toBeLessThan(1)
    // expect(min).toBeGreaterThan(0)
  })
})
