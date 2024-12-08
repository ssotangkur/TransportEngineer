import { describe, expect, it } from 'vitest'
import { MiniMapVisibilityManager } from './miniMapVisibilityManager'
import { AABB } from 'src/utils/aabb'
import { ColorMapper } from 'src/mapping/mapGenerator'

describe('MiniMapVisibilityManager', () => {
  it('should notify subscribers when visibility changes', () => {
    const manager = new MiniMapVisibilityManager(16)
    let newlyVisibleTiles: string[] = []
    let newlyHiddenTiles: string[] = []
    const colorMap: ColorMapper = () => {
      throw new Error('Not implemented')
    }

    const callback = (nv: string[], nh: string[]) => {
      newlyVisibleTiles = nv
      newlyHiddenTiles = nh
    }
    const unsubscribe = manager.subscribe(callback)

    // Initially all tiles are newly visible
    manager.updateVisibility(new AABB(0, 0, 32, 32), colorMap)
    expect(newlyVisibleTiles).toEqual([
      '0,0',
      '0,1',
      '0,2',
      '1,0',
      '1,1',
      '1,2',
      '2,0',
      '2,1',
      '2,2',
    ])
    expect(newlyHiddenTiles).toEqual([])

    manager.updateVisibility(new AABB(16, 16, 32, 32), colorMap)
    // 3rd row and 3rd column, minus 0,3, and 3,0
    expect(newlyVisibleTiles).toEqual(['1,3', '2,3', '3,1', '3,2', '3,3'])
    // Everything w/ 0 as a coordinate should be hidden
    expect(newlyHiddenTiles).toEqual(['0,0', '0,1', '0,2', '1,0', '2,0'])

    unsubscribe()
    manager.updateVisibility(new AABB(0, 0, 32, 32), colorMap)
    // After unsubscribing, nothing should change
    expect(newlyVisibleTiles).toEqual(['1,3', '2,3', '3,1', '3,2', '3,3'])
    expect(newlyHiddenTiles).toEqual(['0,0', '0,1', '0,2', '1,0', '2,0'])
  })

  it('should notify subscribers when visibility changes with negative coordinates', () => {
    const manager = new MiniMapVisibilityManager(16)
    let newlyVisibleTiles: string[] = []
    let newlyHiddenTiles: string[] = []
    const colorMap: ColorMapper = () => {
      throw new Error('Not implemented')
    }

    const callback = (nv: string[], nh: string[]) => {
      newlyVisibleTiles = nv
      newlyHiddenTiles = nh
    }
    const unsubscribe = manager.subscribe(callback)

    // Initially all tiles are newly visible
    manager.updateVisibility(new AABB(0, 0, 32, 32), colorMap)
    expect(newlyVisibleTiles).toEqual([
      '0,0',
      '0,1',
      '0,2',
      '1,0',
      '1,1',
      '1,2',
      '2,0',
      '2,1',
      '2,2',
    ])
    expect(newlyHiddenTiles).toEqual([])

    manager.updateVisibility(new AABB(-8, -8, 32, 32), colorMap)
    // 3rd row and 3rd column, minus 0,3, and 3,0
    expect(newlyVisibleTiles).toEqual(['-1,-1', '-1,0', '-1,1', '0,-1', '1,-1'])
    // Everything w/ 0 as a coordinate should be hidden
    expect(newlyHiddenTiles).toEqual(['0,2', '1,2', '2,0', '2,1', '2,2'])

    unsubscribe()
    manager.updateVisibility(new AABB(0, 0, 32, 32), colorMap)
    // After unsubscribing, nothing should change
    expect(newlyVisibleTiles).toEqual(['1,3', '2,3', '3,1', '3,2', '3,3'])
    expect(newlyHiddenTiles).toEqual(['0,0', '0,1', '0,2', '1,0', '2,0'])
  })
})
