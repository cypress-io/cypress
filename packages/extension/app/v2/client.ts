import { client } from '@packages/socket/browser/client'

export const connect = (host: string, path: string, extraOpts: any = {}) => {
  return client(host, {
    path,
    transports: ['websocket'],
    ...extraOpts,
  })
}
