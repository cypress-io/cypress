// TODO: move this to packages/core-file-server

const _ = require('lodash')
const debug = require('debug')('cypress:server:file_server')
const url = require('url')
const http = require('http')
const path = require('path')
const send = require('send')
const { httpUtils } = require('@packages/network')
const { allowDestroy } = require('./util/server_destroy')
const random = require('./util/random')
const networkFailures = require('./util/network_failures')

const onRequest = function (req, res, expectedToken, fileServerFolder) {
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
  const file = decodeURI(url.parse(path.join(...args)).pathname)

  res.setHeader('x-cypress-file-path', encodeURI(file))

  return send(req, url.parse(req.url).pathname, {
    root: path.resolve(fileServerFolder),
  })
  .on('error', (err) => {
    res.setHeader('x-cypress-file-server-error', true)
    res.setHeader('content-type', 'text/html')
    res.statusCode = err.status

    return res.end(networkFailures.get(file, err.status))
  }).pipe(res)
}

module.exports = {
  create (fileServerFolder) {
    return new Promise(((resolve) => {
      const token = random.id(64)

      const srv = http.createServer(httpUtils.lenientOptions, (req, res) => {
        return onRequest(req, res, token, fileServerFolder)
      })

      allowDestroy(srv)

      return srv.listen(0, '127.0.0.1', () => {
        return resolve({
          token,

          port () {
            return srv.address().port
          },

          address () {
            return `http://localhost:${this.port()}`
          },

          close () {
            return srv.destroyAsync()
          },
        })
      })
    }))
  },
}
