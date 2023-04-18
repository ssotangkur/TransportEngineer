import { RootApis } from 'common/src/routes/root'
import { ApisToProxy } from 'common/src/api/types'

export type ContextPath = {
  path: String
}

const handler = {
  get(target: ContextPath, prop: string, receiver) {
    prop
  },
}
const context: ContextPath = {
  path: '',
}
const ClientImpl = new Proxy(context, handler) as unknown as ApisToProxy<RootApis>

ClientImpl.catalog.addComponentTypeToEntityType.post
