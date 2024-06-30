export class EquilavencyGroups {
  private groupToIdMap: Map<string, number> = new Map()
  private idToCanonicalIdMap: Map<number, number> = new Map()

  add(tileId: number, equivalenceGroup: string) {
    // Empty equivalence groups should be ignored
    if (equivalenceGroup === '') {
      return
    }
    const existingIdForGroup = this.groupToIdMap.get(equivalenceGroup)
    if (existingIdForGroup) {
      this.idToCanonicalIdMap.set(tileId, existingIdForGroup)
    } else {
      this.groupToIdMap.set(equivalenceGroup, tileId)
      this.idToCanonicalIdMap.set(tileId, tileId)
    }
  }

  getCanonicalId(tileId: number): number {
    const canonicalId = this.idToCanonicalIdMap.get(tileId)
    if (!canonicalId) {
      // Tiles not beloinging to any equivalence group are their own canonical id
      return tileId
    }
    return canonicalId
  }

  print() {
    console.log('Equivalency Groups:')
    console.log('Group To Canonical Id:')
    this.groupToIdMap.forEach((value, key) => {
      console.log(`  ${key}: ${value}`)
    })
    console.log('Id To Canonical Id:')
    this.idToCanonicalIdMap.forEach((value, key) => {
      console.log(`  ${key}: ${value}`)
    })
  }
}
