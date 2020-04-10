/* eslint-disable
    no-console,
*/
const http = require('http')
const Promise = require('bluebird')

const srv = http.createServer((req, res) => {
  console.log('HTTP SERVER REQUEST URL:', req.url)
  console.log('HTTP SERVER REQUEST HEADERS:', req.headers)

  res.setHeader('Content-Type', 'text/html')
  res.writeHead(200)

  res.end('<html><body>http server</body></html>')
})

module.exports = {
  srv,

  start () {
    return new Promise((resolve) => {
      srv.listen(8080, () => {
        console.log('server listening on port: 8080')

        resolve(srv)
      })
    })
  },

  stop () {
    return new Promise((resolve) => {
      srv.close(resolve)
    })
  },
}
