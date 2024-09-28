/**
 * Uses bit shifting to combine 2 numbers into a single number
 * @param x integer between 0 and 2^16-1
 * @param y integer between 0 and 2^16-1
 * @returns
 */
export const key2d = (x: number, y: number): number => {
  const buffer = new ArrayBuffer(32)
  const dv = new DataView(buffer)
  dv.setInt16(0, x)
  dv.setInt16(2, y)
  return dv.getInt32(0)
}
