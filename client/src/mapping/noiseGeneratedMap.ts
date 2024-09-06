import _ from 'lodash'
import { makeNoise2D } from 'open-simplex-noise'

export type NoiseMapConfig = {
  baseCoordScale: number
  octaves: number
  decayCoeff: number
  seedOffset: number // Use a different seed offset when generating multiple noise maps at the same time
}

export const createNoiseMap = (
  width: number,
  height: number,
  config: NoiseMapConfig,
  seedFnOrValue: number | (() => number) = () => Date.now(),
) => {
  const { baseCoordScale, octaves, decayCoeff, seedOffset } = config
  const seed = (_.isFunction(seedFnOrValue) ? seedFnOrValue() : seedFnOrValue) + seedOffset
  const noise2d = makeNoise2D(seed)

  const octaveNoise = createOctaveNoiseFn(baseCoordScale, octaves, decayCoeff, noise2d)

  const result: number[][] = []

  for (let y = 0; y < height; y++) {
    const row: number[] = new Array(width)
    for (let x = 0; x < width; x++) {
      row[x] = octaveNoise(x, y)
    }

    result.push(row)
  }

  normalize2DArray(result)

  return result
}

/**
 * Higher Order Function to create and combine multiple
 * octaves of the same noise function.
 */
export const createOctaveNoiseFn = (
  baseCoordScale: number,
  octaves: number,
  decayCoeff: number,
  noiseFn: (x: number, y: number) => number,
) => {
  return (x: number, y: number): number => {
    let octaveCoeff = 1
    let intensityCoeff = 1
    let sum = 0

    for (let o = 0; o < octaves; o++) {
      let noiseX = x * baseCoordScale * octaveCoeff
      let noiseY = y * baseCoordScale * octaveCoeff

      sum += noiseFn(noiseX, noiseY) * intensityCoeff

      // Instead of using Math.pow() which is slow, incrementally calc the coeffs
      octaveCoeff *= 2
      intensityCoeff *= decayCoeff
    }

    return sum
  }
}

/**
 * This mutates the array
 * @param data
 */
export const normalize2DArray = (data: number[][]) => {
  let min = data[0][0] ?? 0
  let max = data[0][0] ?? 0

  const height = data.length
  if (!height) {
    return
  }

  const width = data[0].length

  for (let r = 0; r < height; r++) {
    min = Math.min(min, ...data[r])
    max = Math.max(max, ...data[r])
  }
  const scale = 1 / (max - min)

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      data[r][c] = (data[r][c] - min) * scale
    }
  }
}
