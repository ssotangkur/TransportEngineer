import React from 'react'
import { PropsWithChildren, useEffect, useState } from 'react'

export type WaitForRequestProps = PropsWithChildren<{
  url: string
}>

/**
 * Tests the provide url repeatedly for a success 200 status and only
 * renders children if it succeeds.
 * @param url
 */
export const WaitForRequest = ({ url, children }: WaitForRequestProps) => {
  const [gottenValidResponse, setGottenValidResponse] = useState(false)

  useEffect(() => {
    const queryServer = async () => {
      let status = 500
      while (status != 200) {
        const resp = await fetch(url)
        status = resp.status
      }
      setGottenValidResponse(true)
    }
    void queryServer()
  }, [url])

  if (!gottenValidResponse) {
    return <div>Loading</div>
  }

  return <>{children}</>
}
