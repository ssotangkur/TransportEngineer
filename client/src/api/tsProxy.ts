import { RootApis } from 'common/src/routes/root'
import { ApisToProxy } from 'common/src/api/types'


export type ContextPath = {
  path: string
}

const handler: ProxyHandler<ContextPath> = {
  get(target: ContextPath, prop: string) {
    switch(prop) {
      case "get":
        return async (req: any) => {
          const reqInit: RequestInit = {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          }
          if (req !== undefined) {
            reqInit.body = JSON.stringify(req)
          }
          console.log(`GET: ${target.path} Req:${reqInit.body}`)
          const resp = await fetch(target.path, reqInit)
          const json = await resp.json()
          return json
        }
      case "post":
        return (...args: any) => {
            console.log(`POST: ${target.path} Req:${String(...args)}`)
        }
      default:
        const newContext = {
            path: target.path + "/" + prop
        }
        console.log(newContext.path)

        return new Proxy(newContext, handler);
    }
  },
}

const context: ContextPath = {
  path: './api/v1',
}
export const TsProxy = new Proxy(context, handler) as unknown as ApisToProxy<RootApis>

// TsProxy.catalog.addComponentTypeToEntityType.post
