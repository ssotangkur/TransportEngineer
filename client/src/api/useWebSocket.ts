import { useEffect } from 'react'
import { io } from 'socket.io-client'

export const SOCKET_IO_CONTEXT_PATH = '/ws'

export const socket = io({ path: SOCKET_IO_CONTEXT_PATH })

socket.on('connectionAck', (data) => {
  console.log('connectionAck')
  console.log(data)
})

export const useOnWSEvent = (event: string, callback: (...args: any[]) => void) => {
  useEffect(() => {
    socket.on(event, callback)
    socket.emit('subscribeTo', event)
    return () => {
      socket.off(event, callback)
      socket.emit('unSubscribeTo', event)
    }
  }, [])
}
