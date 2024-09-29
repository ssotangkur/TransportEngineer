import { WorldPositionComponent } from 'src/components/positionComponent'

import G = Phaser.Geom
import { AABB } from './aabb'

export class QuadTree {
  private root: Node | undefined
  private entityNodeMap = new Map<number, Set<Node>>()

  constructor(private bounds: AABB, private maxPerNode: number, private maxDepth: number) {}

  addEntity(eid: number) {
    const x = WorldPositionComponent.x[eid]
    const y = WorldPositionComponent.y[eid]

    if (!this.root) {
      this.root = new Node(this.bounds)
    }

    this.root.add(eid, x, y, this.maxPerNode, this.maxDepth, this.entityNodeMap)
  }

  removeEntity(eid: number) {
    const nodes = this.entityNodeMap.get(eid)
    if (nodes === undefined) {
      return
    }

    for (const node of nodes) {
      node.remove(eid, this.entityNodeMap, this.maxPerNode)
    }
  }

  findEntities(rect: AABB, foundEntities: Set<number>) {
    this.root?.find(rect, foundEntities)
  }

  updateEntity(eid: number) {
    const nodeSet = this.entityNodeMap.get(eid)
    if (nodeSet === undefined) {
      return
    }

    const x = WorldPositionComponent.x[eid]
    const y = WorldPositionComponent.y[eid]

    let isOutsideTree = false
    for (const node of nodeSet) {
      if (!node.update(eid, x, y, this.maxPerNode, this.maxDepth, this.entityNodeMap)) {
        isOutsideTree = true
      }
    }
  }

  print() {
    this.root?.print(1)
  }

  printEntityNodeMap() {
    const setToString = (set: Set<Node>) => {
      const arr = Array.from(set).map((node) => node.toString())
      const str = arr.join(', ')
      return `[${str}]`
    }
    const str = Array.from(this.entityNodeMap.entries())
      .map(([key, value]) => `${key}: ${setToString(value)}`)
      .join(', ')
    console.log('EntityNodeMap:', str)
  }

  size() {
    return this.root?.size() ?? 0
  }

  nodeCount() {
    return this.root?.nodeCount() ?? 0
  }
}

/**
 * Invariants:
 *  - Interior nodes must have undefined <code>entities</code>
 *  - Leaf nodes must have non-empty <code>entities</code>
 *  - If a child node (tl, tr, bl, br) is undefined, then all its siblings are also undefined
 *  - Conversely, if a child node is defined, then all its siblings are defined
 */
class Node {
  private tl: Node | undefined
  private tr: Node | undefined
  private bl: Node | undefined
  private br: Node | undefined

  entities: Set<number> | undefined

  constructor(private bounds: AABB, private parent?: Node) {}

  /**
   *
   * @param eid
   * @param x
   * @param y
   * @param maxPerNode
   * @param depthRemaining
   * @param holdingNodes array to add the nodes that the entity was added to
   */
  add(
    eid: number,
    x: number,
    y: number,
    maxPerNode: number,
    depthRemaining: number,
    entityNodeMap: Map<number, Set<Node>>,
  ) {
    if (!this.bounds.contains(x, y)) {
      // Not in my quadrant, so do nothing
      return
    }
    // No children? Then we are a leaf, see if we have space to add
    if (!this.tl) {
      if (!this.entities) {
        this.entities = new Set([eid])
        addEntityNode(entityNodeMap, eid, this)
        return
      }
      if (this.entities.size >= maxPerNode && depthRemaining > 0) {
        // At capacity, need to make children distribute exiting entities to them
        const halfWidth = this.bounds.width / 2
        const halfHeight = this.bounds.height / 2
        const boundsX = this.bounds.x
        const boundsY = this.bounds.y

        this.tl = new Node(new AABB(boundsX, boundsY, halfWidth, halfHeight), this)
        this.tl.add(eid, x, y, maxPerNode, depthRemaining - 1, entityNodeMap)
        this.tr = new Node(new AABB(boundsX + halfWidth, boundsY, halfWidth, halfHeight), this)
        this.tr.add(eid, x, y, maxPerNode, depthRemaining - 1, entityNodeMap)
        this.bl = new Node(new AABB(boundsX, boundsY + halfHeight, halfWidth, halfHeight), this)
        this.bl.add(eid, x, y, maxPerNode, depthRemaining - 1, entityNodeMap)
        this.br = new Node(
          new AABB(boundsX + halfWidth, boundsY + halfHeight, halfWidth, halfHeight),
          this,
        )
        this.br.add(eid, x, y, maxPerNode, depthRemaining - 1, entityNodeMap)

        // distribute our existing entities to the children
        this.entities.forEach((existingEid) => {
          removeEntityNode(entityNodeMap, existingEid, this)
          const existingX = WorldPositionComponent.x[existingEid]
          const existingY = WorldPositionComponent.y[existingEid]
          this.tl!.add(
            existingEid,
            existingX,
            existingY,
            maxPerNode,
            depthRemaining - 1,
            entityNodeMap,
          )
          this.tr!.add(
            existingEid,
            existingX,
            existingY,
            maxPerNode,
            depthRemaining - 1,
            entityNodeMap,
          )
          this.bl!.add(
            existingEid,
            existingX,
            existingY,
            maxPerNode,
            depthRemaining - 1,
            entityNodeMap,
          )
          this.br!.add(
            existingEid,
            existingX,
            existingY,
            maxPerNode,
            depthRemaining - 1,
            entityNodeMap,
          )
        })
        this.entities = undefined // We're no longer holding entities
        return
      }
      this.entities.add(eid) // We'll push even if the array is full if we're at max depth
      addEntityNode(entityNodeMap, eid, this)
      return
    }
    // We have children, so add to them
    this.tl.add(eid, x, y, maxPerNode, depthRemaining - 1, entityNodeMap)
    this.tr!.add(eid, x, y, maxPerNode, depthRemaining - 1, entityNodeMap)
    this.bl!.add(eid, x, y, maxPerNode, depthRemaining - 1, entityNodeMap)
    this.br!.add(eid, x, y, maxPerNode, depthRemaining - 1, entityNodeMap)
  }

  /**
   * This is meant to be called on the leaf node and will recurse up the tree
   * as the leaves become empty.
   * @param eid
   * @param entityNodeMap
   */
  remove(eid: number, entityNodeMap: Map<number, Set<Node>>, maxPerNode: number) {
    if (this.entities) {
      this.entities.delete(eid)
      removeEntityNode(entityNodeMap, eid, this)
      if (this.entities.size === 0) {
        this.entities = undefined
        // I'm empty, recurse up the parent who will check if my siblings are empty too
        if (this.parent) {
          this.parent.remove(eid, entityNodeMap, maxPerNode)
        }
      }
    } else {
      // I'm not a leaf, but need to check if all my children can fit in me
      // Note: we rely on the invariant that if entities is undefined, then the children must be defined
      // If any of my children are interior nodes, then they already have too many entities so we don't
      // need to recurse down

      // Are any of my children interior nodes? If so, we don't need to collapse
      if (
        this.tl!.isInterior() ||
        this.tr!.isInterior() ||
        this.bl!.isInterior() ||
        this.br!.isInterior()
      ) {
        return
      }

      // Count how many entities are in my children, we know they are all leaves
      const total = this.size()

      if (total <= maxPerNode) {
        const myEntities = new Set<number>()
        this.entities = myEntities

        // remove each entity in each of my children
        this.tl!.removeMyEntities(entityNodeMap, myEntities)
        this.tr!.removeMyEntities(entityNodeMap, myEntities)
        this.bl!.removeMyEntities(entityNodeMap, myEntities)
        this.br!.removeMyEntities(entityNodeMap, myEntities)

        // Update the entityNodeMap for all the entities added to me
        myEntities.forEach((eid) => {
          addEntityNode(entityNodeMap, eid, this)
        })

        // @TODO object pooling for performance
        this.tl = undefined
        this.tr = undefined
        this.bl = undefined
        this.br = undefined

        if (this.parent) {
          this.parent.remove(eid, entityNodeMap, maxPerNode)
        }
      }
    }
  }

  /**
   * Helper method to remove all entities from a node's entities
   * and update the entityNodeMap
   * and clear the entities field
   * @param entityNodeMap
   * @param entitiesRemoved
   */
  removeMyEntities(entityNodeMap: Map<number, Set<Node>>, entitiesRemoved: Set<number>) {
    this.entities?.forEach((eid) => {
      entitiesRemoved.add(eid)
      // Update the entityNodeMap
      removeEntityNode(entityNodeMap, eid, this)
    })
    this.entities?.clear()
    this.entities = undefined
  }

  /**
   *
   * @returns true if we successfully updated the entity. If the
   * entity moves completely outside the bounds of root node, we return false
   */
  update(
    eid: number,
    x: number,
    y: number,
    maxPerNode: number,
    maxDepth: number,
    entityNodeMap: Map<number, Set<Node>>,
  ): boolean {
    if (this.bounds.contains(x, y)) {
      if (this.entities?.has(eid)) {
        // we are leaf and entity hasn't left
        return true
      }
      // else, we are the containing parent interior node so we can
      // just try adding it
      this.add(eid, x, y, maxPerNode, maxDepth, entityNodeMap)
      return true
    }
    // Entity has moved outside this node
    // Remove entity from this node and call update on parent
    this.entities?.delete(eid)
    if (!this.parent) {
      // Entity has moved outside root
      return false
    }
    return this.parent.update(eid, x, y, maxPerNode, maxDepth, entityNodeMap)
  }

  find(rect: AABB, foundEntities: Set<number>) {
    if (!intersects(this.bounds, rect)) {
      return
    }
    if (this.entities) {
      this.entities.forEach((eid) => {
        const x = WorldPositionComponent.x[eid]
        const y = WorldPositionComponent.y[eid]
        if (rect.contains(x, y)) {
          foundEntities.add(eid)
        }
      })
    }

    this.tl?.find(rect, foundEntities)
    this.tr?.find(rect, foundEntities)
    this.bl?.find(rect, foundEntities)
    this.br?.find(rect, foundEntities)
  }

  isEmptyLeaf(): boolean {
    return !this.entities && !this.tl
  }

  isInterior(): boolean {
    // If tl is defined, then the rest must be so this is an interior node
    return !!this.tl
  }

  toString(): string {
    return `(${this.bounds.x}, ${this.bounds.y})(${this.bounds.width}, ${this.bounds.height})-[${
      this.entities && Array.from(this.entities)
    }]`
  }

  nodeCount(): number {
    let count = 1 // For this node

    count += this.tl?.nodeCount() ?? 0
    count += this.tr?.nodeCount() ?? 0
    count += this.bl?.nodeCount() ?? 0
    count += this.br?.nodeCount() ?? 0

    return count
  }

  size(): number {
    // let total = this.entities?.size ?? 0
    // total += this.tl?.size() ?? 0
    // total += this.tr?.size() ?? 0
    // total += this.bl?.size() ?? 0
    // total += this.br?.size() ?? 0
    // return total
    const all = new Set<number>()
    this.allEntities(all)
    return all.size
  }

  print(depth = 0) {
    console.log(Array(depth).join('----') + this.toString())
    this.tl?.print(depth + 1)
    this.tr?.print(depth + 1)
    this.bl?.print(depth + 1)
    this.br?.print(depth + 1)
  }

  /**
   * Recursively find all entities from this node and its children
   */
  allEntities(setToAddTo: Set<number>) {
    if (this.entities) {
      this.entities.forEach((eid) => {
        setToAddTo.add(eid)
      })
    }
    this.tl?.allEntities(setToAddTo)
    this.tr?.allEntities(setToAddTo)
    this.bl?.allEntities(setToAddTo)
    this.br?.allEntities(setToAddTo)
  }
}

export const intersects = (a: AABB, b: AABB) => {
  return (
    a.x <= b.x + b.width && a.x + a.width >= b.x && a.y <= b.y + b.height && a.y + a.height >= b.y
  )
}

export const addEntityNode = (entityNodeMap: Map<number, Set<Node>>, eid: number, node: Node) => {
  const nodes = entityNodeMap.get(eid)
  if (nodes) {
    nodes.add(node)
  } else {
    entityNodeMap.set(eid, new Set([node]))
  }
}

export const removeEntityNode = (
  entityNodeMap: Map<number, Set<Node>>,
  eid: number,
  node: Node,
) => {
  const nodes = entityNodeMap.get(eid)
  if (nodes) {
    nodes.delete(node)
    if (nodes.size === 0) {
      entityNodeMap.delete(eid)
    }
  }
}
