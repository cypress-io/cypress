import { client } from '@packages/socket/browser/client'

export const connect = (host, path, extraOpts = {}) => {
  return client(host, {
    path,
    transports: ['websocket'],
    ...extraOpts,
  })
}
