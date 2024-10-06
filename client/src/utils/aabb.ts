import { WorldPositionComponent } from 'src/components/positionComponent'
import { SpriteComponent } from 'src/components/spriteComponent'

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
