/**
 * Converts an array to a Map where the keys are the result of the key function
 * and the values are elements in the array with the same key value
 * @param arr
 * @param key
 * @returns
 */
export const groupBy = <K, T>(arr: T[], key: (x: T) => K): Map<K, T[]> => {
  const map = new Map<K, T[]>()
  arr.forEach((x) => {
    const k = key(x)
    let xs = map.get(k)
    if (!xs) {
      xs = []
      map.set(k, xs)
    }
    xs.push(x)
  })
  return map
}
