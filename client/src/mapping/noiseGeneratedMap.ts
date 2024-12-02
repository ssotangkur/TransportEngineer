import _ from 'lodash'
import { makeNoise2D } from 'open-simplex-noise'

const noiseFnRange = 2.0 // noiseFn is between -1 and 1

export type NoiseMapConfig = {
  baseCoordScale: number
  octaves: number
  decayCoeff: number
  seedOffset: number // Use a different seed offset when generating multiple noise maps at the same time
  rangeFactor?: number // Since the sum of noise values rarely approaches the absolute range in all octaves at the same time
}

export const createNoiseMap = (
  config: NoiseMapConfig,
  seedFnOrValue: number | (() => number) = () => Date.now(),
) => {
  const { baseCoordScale, octaves, decayCoeff, seedOffset, rangeFactor } = config
  const seed = (_.isFunction(seedFnOrValue) ? seedFnOrValue() : seedFnOrValue) + seedOffset
  const noise2d = makeNoise2D(seed)

  const octaveNoise = createOctaveNoiseFn(baseCoordScale, octaves, decayCoeff, noise2d, rangeFactor)

  return octaveNoise
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
  rangeFactor = 1,
) => {
  let octaveRange = 1
  let sumRange = 0
  for (let o = 0; o < octaves; o++) {
    sumRange += octaveRange
    octaveRange *= decayCoeff
  }
  const range = sumRange * noiseFnRange * rangeFactor

  const offset = range / 2
  const rangeInv = 1 / range

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
    return _.clamp((sum + offset) * rangeInv, 0, 1)
  }
}
