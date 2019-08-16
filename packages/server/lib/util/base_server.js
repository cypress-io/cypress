//# TODO: move this to packages/core-file-server

const http = require('http')
const allowDestroy = require('./server_destroy')

module.exports = {
  listen (onRequest) {
    return new Promise((resolve) => {
      const srv = http.createServer(onRequest)

      allowDestroy(srv)

      const port = () => {
        return srv.address().port
      }

      const address = () => {
        return `http://localhost:${port()}`
      }

      const close = () => {
        return srv.destroyAsync()
      }

      return srv.listen(() => {
        return resolve({
          port,
          address,
          close,
        })
      })
    })
  },
}
