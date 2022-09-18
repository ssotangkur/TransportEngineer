/**
 * Hook to subscribe to event
 */

import { useEffect, useState } from 'react'
import { EventCallbacks, Events } from './events'

export const useEvent = <E extends keyof EventCallbacks>(
  eventName: E,
  callback?: EventCallbacks[E],
) => {
  const [payload, setPayload] = useState<Parameters<EventCallbacks[E]>>()

  useEffect(() => {
    const handler = (...args: any) => {
      setPayload(args)

      if (callback) {
        const fn = callback as (...args: any) => void
        fn(...args)
      }
    }
    Events.on(eventName, handler)
    return () => {
      Events.off(eventName, handler)
    }
  }, [])

  return payload
}
