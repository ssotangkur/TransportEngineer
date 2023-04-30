import { useEffect, useState } from 'react'
import { ManagerOptions, SocketOptions, io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from 'common/src/api/webSocketTypes'
import { EntityType } from 'common/src/entities/entityType'
import { ComponentType } from 'common/src/entities/componentType'
import { getTracePrinter } from 'src/utils/tracePrinter'

export const SOCKET_IO_CONTEXT_PATH = '/ws'
const SOCKET_OPTIONS: Partial<ManagerOptions & SocketOptions> = {
  path: SOCKET_IO_CONTEXT_PATH,
  transports: ['websocket'],
}

/**
 * The socket should be a singleton.
 */
const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  'ws://localhost:3000/catalog',
  SOCKET_OPTIONS,
)

const catalogFunctions: ClientToServerEvents = {
  getCatalog: () => {
    socket.emit('getCatalog')
  },
  addComponentTypeToEntityType: (componentType: ComponentType, entityType: EntityType) => {
    socket.emit('addComponentTypeToEntityType', componentType, entityType)
  },
  removeComponentTypeFromEntityType: (componentType: ComponentType, entityType: EntityType) => {
    socket.emit('removeComponentTypeFromEntityType', componentType, entityType)
  },
}

export const useCatalogFunctions = () => {
  return catalogFunctions
}

export const useCatalog = () => {
  const [catalog, setCatalog] = useState<EntityType[]>([])

  const printTrace = getTracePrinter()

  useEffect(() => {
    socket.on('catalog', (svr_catalog) => {
      console.groupCollapsed('Got Catalog')
      printTrace()
      console.groupEnd()
      setCatalog(svr_catalog)
    })
    catalogFunctions.getCatalog()

    // Unsubscribe
    return () => {
      socket.off('catalog', setCatalog)
    }
  }, [])

  return catalog
}
