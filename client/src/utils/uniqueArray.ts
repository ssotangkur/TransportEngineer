export class UniqueArray<T> {
  private array: T[] = []
  private set = new Set<T>()

  constructor(initial?: T[]) {
    if (initial) {
      initial.forEach((item) => this.push(item))
    }
  }

  push(item: T) {
    if (!this.set.has(item)) {
      this.set.add(item)
      this.array.push(item)
    }
  }

  shift() {
    const item = this.array.shift()
    if (item) {
      this.set.delete(item)
    }
    return item
  }

  get length() {
    return this.array.length
  }

  toArray() {
    return this.array
  }
}
