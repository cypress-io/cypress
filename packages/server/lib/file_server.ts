// TODO: move this to packages/core-file-server
import _ from 'lodash'
import debugModule from 'debug'
import url from 'url'
import http from 'http'
import path from 'path'
import send from 'send'
import { httpUtils } from '@packages/network'
import { allowDestroy } from './util/server_destroy'
import { id as randomId } from './util/random'
import networkFailures from './util/network_failures'
import type { AddressInfo } from 'net'

const debug = debugModule('cypress:server:file_server')

export type FileServer = {
  token: string
  port: () => number
  address: () => string
  close: () => void
}

const onRequest = function (req: http.IncomingMessage, res: http.ServerResponse, expectedToken: string, fileServerFolder: string) {
  const token = req.headers['x-cypress-authorization']

  if (token !== expectedToken) {
    debug('authorization failed on file_server request %o', { reqUrl: req.url, expectedToken, token })
    res.statusCode = 401
    res.end()

    return
  }

  const args = _.compact([
    fileServerFolder,
    req.url,
  ])

  // strip off any query params from our req's url
  // since we're pulling this from the file system
  // it does not understand query params
  // and make sure we decode the uri which swaps out
  // %20 with white space
  const file = decodeURI(url.parse(path.join(...args)).pathname as string)

  res.setHeader('x-cypress-file-path', encodeURI(file))

  return send(req, url.parse(req.url as string).pathname as string, {
    root: path.resolve(fileServerFolder),
  })
  .on('error', (err) => {
    res.setHeader('x-cypress-file-server-error', 'true')
    res.setHeader('content-type', 'text/html')
    res.statusCode = err.status

    return res.end(networkFailures.get(file, err.status))
  }).pipe(res)
}

export const create = (fileServerFolder: string): Promise<FileServer> => {
  return new Promise(((resolve) => {
    const token = randomId(64)

    const srv = http.createServer(httpUtils.lenientOptions, (req: http.IncomingMessage, res: http.ServerResponse) => {
      return onRequest(req, res, token, fileServerFolder)
    })

    allowDestroy(srv)

    return srv.listen(0, '127.0.0.1', () => {
      const server: FileServer = {
        token,
        port () {
          return (srv.address() as AddressInfo).port
        },
        address () {
          return `http://localhost:${this.port()}`
        },
        close () {
          // @ts-expect-error - destroyAsync is defined when allowDestroy is called
          return srv.destroyAsync()
        },
      }

      return resolve(server)
    })
  }))
}
