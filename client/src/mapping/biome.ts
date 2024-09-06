/**
 * You can think of biomes as a filter on the possible WangColors for a tile.
 * Each biome is deterministic based on elevation, temperature, and precipitation.
 *
 * Some useful information
 * https://www.nature.com/scitable/knowledge/library/terrestrial-biomes-13236757/
 */

import { createNoiseMap, NoiseMapConfig } from './noiseGeneratedMap'

const HEIGHT_MAP_CONFIG: NoiseMapConfig = {
  baseCoordScale: 0.02,
  octaves: 4,
  decayCoeff: 0.5,
  seedOffset: 1,
}

const PRECIPITATION_MAP_CONFIG: NoiseMapConfig = {
  baseCoordScale: 0.02,
  octaves: 4,
  decayCoeff: 0.5,
  seedOffset: 2,
}

const TEMPERATURE_MAP_CONFIG: NoiseMapConfig = {
  baseCoordScale: 0.02,
  octaves: 4,
  decayCoeff: 0.5,
  seedOffset: 3,
}

export const createHeightMap = (
  width: number,
  height: number,
  seedFnOrValue: number | (() => number) = () => Date.now(),
): number[][] => {
  return createNoiseMap(width, height, HEIGHT_MAP_CONFIG, seedFnOrValue)
}

export const createPrecipitationMap = (
  width: number,
  height: number,
  seedFnOrValue: number | (() => number) = () => Date.now(),
): number[][] => {
  return createNoiseMap(width, height, PRECIPITATION_MAP_CONFIG, seedFnOrValue)
}

export const createTemperatureMap = (
  width: number,
  height: number,
  seedFnOrValue: number | (() => number) = () => Date.now(),
): number[][] => {
  return createNoiseMap(width, height, TEMPERATURE_MAP_CONFIG, seedFnOrValue)
}

export const ALL_BIOMES = [
  'ocean',
  'desert',
  'grassland',
  'forest',
  'jungle',
  'taiga',
  'tundra',
] as const
export type Biome = (typeof ALL_BIOMES)[number]

export const isBiome = (biome: string): biome is Biome => {
  return ALL_BIOMES.includes(biome as Biome)
}

export type TemperatureZone = 'arctic' | 'sub-arctic' | 'temperate' | 'tropical'

export type PrecipitationZone = 'arid' | 'semi-arid' | 'moderate' | 'rainforest'

// Height constants
export const MAX_OCEAN_HEIGHT = 0.2
export const MIN_MOUNTAIN_HEIGHT = 0.8

// Temperature constants
export const MAX_ARCTIC_TEMPERATURE = 0.1
export const MAX_SUB_ARCTIC_TEMPERATURE = 0.2
export const MAX_TEMPARATE_TEMERATURE = 0.7 // TROPICAL is everything above this

// Precipitation constants
export const MAX_DESERT_PRECIPITATION = 0.1
export const MAX_GRASSLAND_PRECIPITATION = 0.4
export const MIN_TROPICAL_PRECIPITATION = 0.6

export type BiomeCell = {
  biome: Biome
  height: number
  temperature: number
  precipitation: number
  precipitationZone: PrecipitationZone
  temperatureZone: TemperatureZone
}

export const createBiomeMap = (width: number, height: number) => {
  const heightMap = createHeightMap(width, height)
  const temperatureMap = createTemperatureMap(width, height)
  const precipitationMap = createPrecipitationMap(width, height)

  const result: BiomeCell[][] = []
  for (let r = 0; r < height; r++) {
    const row: BiomeCell[] = []
    for (let c = 0; c < width; c++) {
      const height = heightMap[r][c]
      const temperature = temperatureMap[r][c]
      const precipitation = precipitationMap[r][c]
      const biomeCell = getBiomeCell(height, temperature, precipitation)
      row.push(biomeCell)
    }
    result.push(row)
  }

  return result
}

/**
 * Temp vs Precipitation
 *              ARID    SEMI-ARID  MODERATE  RAINFOREST
 * ARCTIC       TUNDRA   TUNDRA    TUNDRA     TUNDRA
 * SUB-ARCTIC   DESERT   TAIGA     TAIGA      TAIGA
 * TEMPERATE    DESERT   GRASSLAND FOREST     FOREST
 * TROPICAL     DESERT   GRASSLAND JUNGLE     JUNGLE
 *
 *
 * @param height
 * @param temperature
 * @param precipitation
 * @returns
 */

export const getBiomeCell = (height: number, temperature: number, precipitation: number) => {
  const tempZone = getTemperatureZone(temperature)
  const precipZone = getPrecipitationZone(precipitation)
  const result: BiomeCell = {
    biome: 'ocean', // will change later
    height,
    temperature,
    precipitation,
    temperatureZone: tempZone,
    precipitationZone: precipZone,
  }
  // Anything too low is ocean
  if (height < MAX_OCEAN_HEIGHT) {
    result.biome = 'ocean'
    return result
  }

  // Anything too cold is tundra
  if (tempZone === 'arctic') {
    result.biome = 'tundra'
    return result
  }

  // Anything too dry is desert
  if (precipZone === 'arid') {
    result.biome = 'desert'
    return result
  }

  if (tempZone === 'sub-arctic') {
    result.biome = 'taiga'
    return result
  }

  if (precipZone === 'semi-arid') {
    result.biome = 'grassland'
    return result
  }

  if (tempZone === 'temperate') {
    result.biome = 'forest'
    return result
  }

  result.biome = 'jungle'
  return result
}

export const getTemperatureZone = (temperature: number): TemperatureZone => {
  if (temperature < MAX_ARCTIC_TEMPERATURE) {
    return 'arctic'
  } else if (temperature < MAX_SUB_ARCTIC_TEMPERATURE) {
    return 'sub-arctic'
  } else if (temperature < MAX_TEMPARATE_TEMERATURE) {
    return 'temperate'
  } else {
    return 'tropical'
  }
}

export const getPrecipitationZone = (precipitation: number): PrecipitationZone => {
  if (precipitation < MAX_DESERT_PRECIPITATION) {
    return 'arid'
  } else if (precipitation < MAX_GRASSLAND_PRECIPITATION) {
    return 'semi-arid'
  } else if (precipitation < MIN_TROPICAL_PRECIPITATION) {
    return 'moderate'
  } else {
    return 'rainforest'
  }
}
