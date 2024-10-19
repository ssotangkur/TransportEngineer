/**
 * Given a set of offsets, this function returns a function that translates
 * coordinates by subtracting the offsets from the coordinates.
 * @param xOffset
 * @param yOffset
 * @returns
 */
export const offsetTranslator = (
  xOffset: number,
  yOffset: number,
): ((x: number, y: number) => { x: number; y: number }) => {
  return (x: number, y: number) => ({ x: x - xOffset, y: y - yOffset })
}
