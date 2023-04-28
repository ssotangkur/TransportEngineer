import { useEffect, useState } from 'react'
import { ManagerOptions, SocketOptions, io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from 'common/src/api/webSocketTypes'
import { EntityType } from 'common/src/entities/entityType'
import { ComponentType } from 'common/src/entities/componentType'

export const SOCKET_IO_CONTEXT_PATH = '/ws'
const SOCKET_OPTIONS: Partial<ManagerOptions & SocketOptions> = {
  path: SOCKET_IO_CONTEXT_PATH,
  transports: ['websocket'],
}

type CatalogFunctions = {
  getCatalog: () => void
  addComponentTypeToEntityType: (componentType: ComponentType, entityType: EntityType) => void
  removeComponentTypeFromEntityType: (componentType: ComponentType, entityType: EntityType) => void
}

const defaultCatalogFunctions: CatalogFunctions = {
  getCatalog: () => {},
  addComponentTypeToEntityType: (_componentType: ComponentType, _entityType: EntityType) => {},
  removeComponentTypeFromEntityType: (_componentType: ComponentType, _entityType: EntityType) => {},
}

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io('/catalog', SOCKET_OPTIONS)

export const useCatalog = () => {
  const [catalog, setCatalog] = useState<EntityType[]>([])
  const [catalogFunctions, setCatalogFunctions] =
    useState<CatalogFunctions>(defaultCatalogFunctions)

  useEffect(() => {
    socket.on('catalog', (svr_catalog) => {
      console.log('Got Catalog')
      setCatalog(svr_catalog)
    })

    setCatalogFunctions({
      getCatalog: () => {
        socket.emit('getCatalog')
      },
      addComponentTypeToEntityType: (componentType: ComponentType, entityType: EntityType) => {
        socket.emit('addComponentTypeToEntityType', componentType, entityType)
      },
      removeComponentTypeFromEntityType: (componentType: ComponentType, entityType: EntityType) => {
        socket.emit('removeComponentTypeFromEntityType', componentType, entityType)
      },
    })

    // Unsubscribe
    return () => {
      socket.off('catalog', setCatalog)
      // socket.disconnect()
    }
  }, [])

  return {
    catalog: catalog,
    getCatalog: catalogFunctions.getCatalog,
    addComponentTypeToEntityType: catalogFunctions.addComponentTypeToEntityType,
    removeComponentTypeFromEntityType: catalogFunctions.removeComponentTypeFromEntityType,
  }
}
