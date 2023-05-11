import { math } from './math.js'

export type Bounds = number[][]
export type Dimensions = number[]
export type Position = number[]

export type Node = {
  next: null | Node
  prev: null | Node
  client: Client
}

export type Client = {
  position: Position
  dimensions: Dimensions
  _cells: {
    min: null | Position
    max: null | Position
    nodes: null | Node[][]
  }
  _queryId: number
}
export type Cells = (Node | null)[][]

export class SpatialHashGrid {
  private cells: Cells
  private queryIds

  /**
   *
   * @param bounds the min and max points (diagonal) that make the bounds of the grid
   * @param dimensions number of cells along each dimensional axis
   */
  constructor(private bounds: Bounds, private dimensions: Dimensions) {
    const [x, y] = dimensions
    this.cells = [...Array(x)].map((_) => [...Array(y)].map((_) => null))
    this.queryIds = 0
  }

  _GetCellIndex(position: Position) {
    const x = math.sat((position[0] - this.bounds[0][0]) / (this.bounds[1][0] - this.bounds[0][0]))
    const y = math.sat((position[1] - this.bounds[0][1]) / (this.bounds[1][1] - this.bounds[0][1]))

    const xIndex = Math.floor(x * (this.dimensions[0] - 1))
    const yIndex = Math.floor(y * (this.dimensions[1] - 1))

    return [xIndex, yIndex]
  }

  NewClient(position: Position, dimensions: Dimensions) {
    const client: Client = {
      position: position,
      dimensions: dimensions,
      _cells: {
        min: null,
        max: null,
        nodes: null,
      },
      _queryId: -1,
    }

    this._Insert(client)

    return client
  }

  UpdateClient(client: Client) {
    const [x, y] = client.position
    const [w, h] = client.dimensions

    const i1 = this._GetCellIndex([x - w / 2, y - h / 2])
    const i2 = this._GetCellIndex([x + w / 2, y + h / 2])

    if (
      client._cells.min![0] == i1[0] &&
      client._cells.min![1] == i1[1] &&
      client._cells.max![0] == i2[0] &&
      client._cells.max![1] == i2[1]
    ) {
      return
    }

    this.Remove(client)
    this._Insert(client)
  }

  FindNear(position: Position, bounds: Dimensions) {
    const [x, y] = position
    const [w, h] = bounds

    const i1 = this._GetCellIndex([x - w / 2, y - h / 2])
    const i2 = this._GetCellIndex([x + w / 2, y + h / 2])

    const clients = []
    const queryId = this.queryIds++

    for (let x = i1[0], xn = i2[0]; x <= xn; ++x) {
      for (let y = i1[1], yn = i2[1]; y <= yn; ++y) {
        let head = this.cells[x][y]

        while (head) {
          const v = head.client
          head = head.next

          if (v._queryId != queryId) {
            v._queryId = queryId
            clients.push(v)
          }
        }
      }
    }
    return clients
  }

  _Insert(client: Client) {
    const [x, y] = client.position
    const [w, h] = client.dimensions

    const i1 = this._GetCellIndex([x - w / 2, y - h / 2])
    const i2 = this._GetCellIndex([x + w / 2, y + h / 2])

    const nodes: Node[][] = []

    for (let x = i1[0], xn = i2[0]; x <= xn; ++x) {
      nodes.push([])

      for (let y = i1[1], yn = i2[1]; y <= yn; ++y) {
        const xi = x - i1[0]

        const head: Node = {
          next: null,
          prev: null,
          client: client,
        }

        nodes[xi].push(head)

        head.next = this.cells[x][y]
        if (this.cells[x][y]) {
          this.cells[x][y]!.prev = head
        }

        this.cells[x][y] = head
      }
    }

    client._cells.min = i1
    client._cells.max = i2
    client._cells.nodes = nodes
  }

  Remove(client: Client) {
    const i1 = client._cells.min
    const i2 = client._cells.max

    for (let x = i1![0], xn = i2![0]; x <= xn; ++x) {
      for (let y = i1![1], yn = i2![1]; y <= yn; ++y) {
        const xi = x - i1![0]
        const yi = y - i1![1]
        const node = client._cells.nodes![xi][yi]

        if (node.next) {
          node.next.prev = node.prev
        }
        if (node.prev) {
          node.prev.next = node.next
        }

        if (!node.prev) {
          this.cells[x][y] = node.next
        }
      }
    }

    client._cells.min = null
    client._cells.max = null
    client._cells.nodes = null
  }
}
