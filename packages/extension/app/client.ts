import { client } from '@packages/socket/lib/browser'

export const connect = (host, path, extraOpts = {}) => {
  return client.io(host, {
    path,
    transports: ['websocket'],
    ...extraOpts,
  })
}
