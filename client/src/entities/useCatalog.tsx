import { useState } from 'react'
import { EntityType } from '../../../common/src/entities/entityType'
import { useOnWSEvent } from 'src/api/useWebSocket'

export const useCatalog = () => {
  const [catalog, setCatalog] = useState<EntityType[]>()
  useOnWSEvent('catalog', (catalog_from_websocket: EntityType[]) =>
    setCatalog(catalog_from_websocket),
  )

  // useEffect(() => {
  //   getCatalog().then((c) => setCatalog(c))
  // }, [])

  return catalog
}
