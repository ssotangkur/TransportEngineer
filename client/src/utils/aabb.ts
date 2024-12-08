import { WorldPositionComponent } from 'src/components/positionComponent'
import { SpriteComponent } from 'src/components/spriteComponent'
import { MapInfo } from './mapInfo'

/**
 * Axis Aligned Bounding Box
 */
export class AABB {
  constructor(public x: number, public y: number, public width: number, public height: number) {}

  /**
   * This does a left-top inclusive but right-bottom exclusive check
   * @param x
   * @param y
   * @returns
   */
  contains(x: number, y: number) {
    return x >= this.x && x < this.x + this.width && y >= this.y && y < this.y + this.height
  }

  /**
   * Does a left-top inclusive and right-bottom inclusive check
   * @param x
   * @param y
   * @returns
   */
  containsInclusive(x: number, y: number) {
    return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height
  }

  centerPoint(ptToUpdate?: Phaser.Math.Vector2): Phaser.Math.Vector2 {
    if (!ptToUpdate) {
      return new Phaser.Math.Vector2(this.x + this.width / 2, this.y + this.height / 2)
    }
    ptToUpdate.x = this.x + this.width / 2
    ptToUpdate.y = this.y + this.height / 2
    return ptToUpdate
  }

  getRandomPoint(ptToUpdate?: Phaser.Math.Vector2): Phaser.Math.Vector2 {
    if (!ptToUpdate) {
      return new Phaser.Math.Vector2(
        this.x + this.width * Math.random(),
        this.y + this.height * Math.random(),
      )
    }
    ptToUpdate.x = this.x + this.width * Math.random()
    ptToUpdate.y = this.y + this.height * Math.random()
    return ptToUpdate
  }

  /**
   * Modifies the AABB using the x & y transform functions
   * @param aabb
   * @param xTransform
   * @param yTransform
   */
  transform = (xTransform: (x: number) => number, yTransform: (y: number) => number) => {
    this.x = xTransform(this.x)
    this.y = yTransform(this.y)
    this.width = xTransform(this.width)
    this.height = yTransform(this.height)
  }

  clone = () => {
    return new AABB(this.x, this.y, this.width, this.height)
  }

  /**
   * Iterates over all integer points in the AABB and calls the provided function
   * @param func
   */
  forEach(func: (x: number, y: number) => void) {
    for (let x = this.x; x <= this.x + this.width; x++) {
      for (let y = this.y; y <= this.y + this.height; y++) {
        func(x, y)
      }
    }
  }
}

export const aabbByCenter = (centerX: number, centerY: number, width: number, height: number) => {
  return new AABB(centerX - width / 2, centerY - height / 2, width, height)
}

export const getAabbFromEntity = (eid: number) => {
  const x = WorldPositionComponent.x[eid]
  const y = WorldPositionComponent.y[eid]
  const width = SpriteComponent.width[eid]
  const height = SpriteComponent.height[eid]
  return aabbByCenter(x, y, width, height)
}

/**
 * Transforms an AABB (in place) in world coordinates into an AABB in tile coordinates
 * @param aabb
 * @param mapInfo
 */
export const transformWorldAABBToTile = (aabb: AABB, mapInfo: MapInfo) => {
  aabb.transform(mapInfo.worldToTileX, mapInfo.worldToTileY)
}
