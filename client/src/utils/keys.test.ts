import { describe, it, expect } from 'vitest'
import { key2d } from './keys'

describe('key2d', () => {
  it.each([
    [0, 0, 0],
    [0, 1, 1],
    [1, 0, 65536],
    [1, 1, 65537],
    [32767, 32767, 2147450879],
    [-1, 0, -65536],
    [0, -1, 65535],
    [-1, -1, -1],
    [-32767, -32767, -2147385343],
    [32767, -32767, 2147450881],
    [-32767, 32767, -2147385345],
  ])('for input (%i, %i) returns %i', (x, y, expected) => {
    expect(key2d(x, y)).toBe(expected)
  })
})
