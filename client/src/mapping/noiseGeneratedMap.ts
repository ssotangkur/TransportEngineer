import _ from 'lodash'
import { makeNoise2D } from 'open-simplex-noise'

const OCTAVES = 4
const DECAY_COEFF = 0.5
const BASE_COORD_SCALE = 0.02

export const createHeightMap = (
  width: number,
  height: number,
  seedFnOrValue: number | (() => number) = () => Date.now(),
): number[][] => {
  const seed = _.isFunction(seedFnOrValue) ? seedFnOrValue() : seedFnOrValue
  const noise2d = makeNoise2D(seed)

  const octaveNoise = createOctaveNoiseFn(BASE_COORD_SCALE, OCTAVES, DECAY_COEFF, noise2d)

  const result: number[][] = []

  for (let y = 0; y < height; y++) {
    const row: number[] = new Array(width)
    for (let x = 0; x < width; x++) {
      row[x] = octaveNoise(x, y)
    }

    result.push(row)
  }

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

const heightsToId = [
  [0.7, 71], // tree
  [0.3, 1], // grass
  [0, 62], // water
]

export const getTileIdForHeight = (height: number) => {
  for (let i = 0; i < heightsToId.length; i++) {
    const [minHeight, tileId] = heightsToId[i]
    if (height >= minHeight) {
      return tileId
    }
  }
  return heightsToId[heightsToId.length - 1][1]
}

export const generateMapDataUsingNoise = (width: number, height: number) => {
  const hData = createHeightMap(width, height)

  normalize2DArray(hData)

  console.log(hData)
  const data = hData.map((row) => {
    return row.map(getTileIdForHeight)
  })
  return data
}
