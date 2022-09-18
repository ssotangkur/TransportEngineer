import { useEffect, useState } from 'react'
import { getCatalog } from './catalog'
import { EntityType } from '../../../common/src/entities/entityType'

export const useCatalog = () => {
  const [catalog, setCatalog] = useState<EntityType[]>()

  useEffect(() => {
    getCatalog().then((c) => setCatalog(c))
  }, [])

  return catalog
}
