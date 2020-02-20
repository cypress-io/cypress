/* eslint-disable
    no-console,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const https = require('https')
const Promise = require('bluebird')
const { allowDestroy } = require('@packages/network')
const certs = require('./certs')

const defaultOnRequest = function (req, res) {
  console.log('HTTPS SERVER REQUEST URL:', req.url)
  console.log('HTTPS SERVER REQUEST HEADERS:', req.headers)

  res.setHeader('Content-Type', 'text/html')
  res.writeHead(200)

  return res.end('<html><head></head><body>https server</body></html>')
}

let servers = []

const create = (onRequest) => {
  return https.createServer(certs, onRequest != null ? onRequest : defaultOnRequest)
}

module.exports = {
  create,

  start (port, onRequest) {
    return new Promise((resolve) => {
      const srv = create(onRequest)

      allowDestroy(srv)

      servers.push(srv)

      return srv.listen(port, () => {
        console.log(`server listening on port: ${port}`)

        return resolve(srv)
      })
    })
  },

  stop () {
    const stop = (srv) => {
      return new Promise((resolve) => {
        return srv.destroy(resolve)
      })
    }

    return Promise.map(servers, stop)
    .then(() => {
      return servers = []
    })
  },
}
