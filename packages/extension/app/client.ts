import { client } from '@packages/socket/lib/browser'

export const connect = (host, path, extraOpts = {}) => {
  return client(host, {
    path,
    transports: ['websocket'],
    ...extraOpts,
  })
}
