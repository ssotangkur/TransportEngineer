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
  public contains(x: number, y: number) {
    return x >= this.x && x < this.x + this.width && y >= this.y && y < this.y + this.height
  }
}
