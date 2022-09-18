// import catalogFile from 'data/catalog.json'
import { Events } from 'src/events/events'
import { EntityType } from 'common/src/entities/entityType'
import { AddComponentTypeToEntityTypeRequest } from 'common/src/api/catalogApi'

// In production we import the file directly, but in dev we
// need the backend to send it to us
// export const catalog: EntityType[] = catalogFile

export class Catalog {
  constructor(private catalogFile: string) {}

  load() {}
}

export const getCatalog = async (): Promise<EntityType[]> => {
  const url = import.meta.env.DEV ? '/api/v1/catalog' : 'catalog.json'
  const response = await fetch(url)
  const json = await response.json()
  return json as EntityType[]
}

Events.on('addComponentTypeToEntityType', (componentType, entityType) => {
  const request: AddComponentTypeToEntityTypeRequest = {
    componentType,
    entityType,
  }

  void fetch('/api/v1/catalog/addComponentTypeToEntityType', {
    method: 'POST',
    body: JSON.stringify(request),
    headers: {
      'Content-Type': 'application/json',
    },
  })
  // Fire and forget
})
