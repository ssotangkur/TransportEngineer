import { describe, expect, it } from 'vitest'
import { intersects, QuadTree } from './quadTree'
import { createWorld } from 'bitecs'
import { addComponent } from 'bitecs'
import { WorldPositionComponent } from 'src/components/positionComponent'
import { addEntity } from 'bitecs'

describe('intersects', () => {
  it('returns true if a and b intersect', () => {
    const a = new Phaser.Geom.Rectangle(0, 0, 10, 10)
    const b = new Phaser.Geom.Rectangle(5, 5, 10, 10)
    expect(intersects(a, b)).toEqual(true)
    expect(intersects(b, a)).toEqual(true)
  })

  it('returns false if a and b do not intersect', () => {
    const a = new Phaser.Geom.Rectangle(0, 0, 1, 1)
    const b = new Phaser.Geom.Rectangle(2, 2, 1, 1)
    expect(intersects(a, b)).toEqual(false)
    expect(intersects(b, a)).toEqual(false)
  })

  it('returns true if a and b intersect partially', () => {
    const a = new Phaser.Geom.Rectangle(0, 0, 2, 2)
    const b = new Phaser.Geom.Rectangle(1, 1, 2, 2)
    expect(intersects(a, b)).toEqual(true)
    expect(intersects(b, a)).toEqual(true)
  })

  it('returns true if a and b intersect corner to corner', () => {
    const a = new Phaser.Geom.Rectangle(0, 0, 1, 1)
    const b = new Phaser.Geom.Rectangle(1, 1, 1, 1)
    expect(intersects(a, b)).toEqual(true)
    expect(intersects(b, a)).toEqual(true)
  })

  it('returns true if a and b intersect on horizontal edge', () => {
    const a = new Phaser.Geom.Rectangle(0, 0, 1, 1)
    const b = new Phaser.Geom.Rectangle(0, 1, 1, 1)
    expect(intersects(a, b)).toEqual(true)
    expect(intersects(b, a)).toEqual(true)
  })

  it('returns true if a and b intersect on vertical edge', () => {
    const a = new Phaser.Geom.Rectangle(0, 0, 1, 1)
    const b = new Phaser.Geom.Rectangle(1, 0, 1, 1)
    expect(intersects(a, b)).toEqual(true)
    expect(intersects(b, a)).toEqual(true)
  })
})

describe('quadTree', () => {
  const addEntityAt = (world: any, x: number, y: number) => {
    const eid = addEntity(world)
    addComponent(world, WorldPositionComponent, eid)
    WorldPositionComponent.x[eid] = x
    WorldPositionComponent.y[eid] = y
    return eid
  }

  it('adds an entity within the bounds', () => {
    const bounds = new Phaser.Geom.Rectangle(0, 0, 10, 10)
    const world = createWorld({})
    const eid = addEntityAt(world, 1, 1)

    const qt = new QuadTree(bounds, 10, 5)
    qt.addEntity(eid)

    const found = new Set<number>()
    qt.findEntities(new Phaser.Geom.Rectangle(0, 0, 2, 2), found)

    expect(Array.from(found).sort()).toEqual([eid])
  })

  it('does not add an entity outside the bounds', () => {
    const bounds = new Phaser.Geom.Rectangle(0, 0, 10, 10)
    const world = createWorld({})
    const eid = addEntityAt(world, 11, 11)

    const qt = new QuadTree(bounds, 10, 5)
    qt.addEntity(eid)

    const found = new Set<number>()
    qt.findEntities(new Phaser.Geom.Rectangle(0, 0, 10, 10), found)

    expect(Array.from(found).sort()).toEqual([])
  })

  it('adds 100 entities within the bounds', () => {
    const bounds = new Phaser.Geom.Rectangle(0, 0, 10, 10)
    const world = createWorld({})
    const entities: number[] = []
    for (let i = 0; i < 100; i++) {
      entities.push(addEntityAt(world, Math.random() * 5, Math.random() * 5))
    }

    const qt = new QuadTree(bounds, 10, 5)
    for (const eid of entities) {
      qt.addEntity(eid)
    }

    console.log(`Size: ${qt.size()}`)
    console.log(`NodeCount: ${qt.nodeCount()}`)

    const found = new Set<number>()
    qt.findEntities(new Phaser.Geom.Rectangle(0, 0, 10, 10), found)

    expect(Array.from(found).sort()).toEqual(entities.sort())
  })

  it('finds entities in specific rect', () => {
    const bounds = new Phaser.Geom.Rectangle(0, 0, 16, 16)
    const world = createWorld({})
    const entitiesToFind: number[] = []
    const entitiesToNotFind: number[] = []

    const searchRect = new Phaser.Geom.Rectangle(10, 10, 1, 1)
    for (let i = 0; i < 10; i++) {
      const pt = searchRect.getRandomPoint()
      entitiesToFind.push(addEntityAt(world, pt.x, pt.y))
    }

    // Add entities every where else
    for (let i = 0; i < 100; i++) {
      let x,
        y = 0
      do {
        x = Math.random() * 16
        y = Math.random() * 16
      } while (searchRect.contains(x, y))
      entitiesToNotFind.push(addEntityAt(world, x, y))
    }

    const qt = new QuadTree(bounds, 4, 5)
    for (const eid of entitiesToNotFind) {
      qt.addEntity(eid)
    }
    for (const eid of entitiesToFind) {
      qt.addEntity(eid)
    }

    const found = new Set<number>()
    qt.findEntities(searchRect, found)
    expect(Array.from(found).sort()).toEqual(entitiesToFind.sort())
  })

  const addAndPrintEntities = (entities: number[], qt: QuadTree) => {
    for (const eid of entities) {
      const x = WorldPositionComponent.x[eid]
      const y = WorldPositionComponent.y[eid]
      console.log(`Adding: ${eid} (${x}, ${y})===================`)
      qt.addEntity(eid)
      console.log(`Node Count: ${qt.nodeCount()}  Size: ${qt.size()}`)
      qt.print()
      qt.printEntityNodeMap()
    }
  }

  const deleteAndPrintEntities = (entities: number[], qt: QuadTree) => {
    for (const eid of entities) {
      const x = WorldPositionComponent.x[eid]
      const y = WorldPositionComponent.y[eid]
      console.log(`Deleting: ${eid} (${x}, ${y})===================`)
      qt.removeEntity(eid)
      console.log(`Node Count: ${qt.nodeCount()}  Size: ${qt.size()}`)
      qt.print()
      qt.printEntityNodeMap()
    }
  }

  it('deletes entities', () => {
    const bounds = new Phaser.Geom.Rectangle(0, 0, 16, 16)
    const world = createWorld({})
    const entitiesToFind: number[] = []
    const entitiesToDelete: number[] = []

    // Create entities to find later on
    entitiesToFind.push(addEntityAt(world, 0.9, 0.9))

    // Create entities we will add then delete
    entitiesToDelete.push(addEntityAt(world, 1.5, 1.5))
    entitiesToDelete.push(addEntityAt(world, 2.9, 2.9))
    entitiesToDelete.push(addEntityAt(world, 3, 12))
    entitiesToDelete.push(addEntityAt(world, 4, 15))
    entitiesToDelete.push(addEntityAt(world, 12, 10))
    entitiesToDelete.push(addEntityAt(world, 3, 4))
    entitiesToDelete.push(addEntityAt(world, 8, 8))

    const qt = new QuadTree(bounds, 1, 5)

    addAndPrintEntities(entitiesToDelete, qt)

    addAndPrintEntities(entitiesToFind, qt)

    deleteAndPrintEntities(entitiesToDelete, qt)

    console.log(`Node Count: ${qt.nodeCount()}`)
    console.log(`Size: ${qt.size()}`)

    const found = new Set<number>()
    qt.findEntities(bounds, found)

    expect(Array.from(found).sort()).toEqual(entitiesToFind.sort())
  })

  it('collapses nodes', () => {
    const bounds = new Phaser.Geom.Rectangle(0, 0, 16, 16)
    const world = createWorld({})
    const entitiesToFind: number[] = []
    const entitiesToDelete: number[] = []

    // Create entities to find later on
    entitiesToFind.push(addEntityAt(world, 0.9, 0.9))
    entitiesToFind.push(addEntityAt(world, 1, 1))
    entitiesToFind.push(addEntityAt(world, 1.1, 1.1))
    entitiesToFind.push(addEntityAt(world, 1.2, 1.2))

    // Create entities we will add then delete
    entitiesToDelete.push(addEntityAt(world, 1.3, 1.3))

    const qt = new QuadTree(bounds, 4, 5)

    // These should go into the same node
    addAndPrintEntities(entitiesToFind, qt)

    expect(qt.nodeCount()).toEqual(1)

    // This will cause the node to split
    addAndPrintEntities(entitiesToDelete, qt)

    expect(qt.nodeCount()).toEqual(5)

    // Deleting one should collapse the node
    deleteAndPrintEntities(entitiesToDelete, qt)
    expect(qt.nodeCount()).toEqual(1)
    expect(qt.size()).toEqual(4)
  })
})
