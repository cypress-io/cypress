const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = 12345
const HOST = '127.0.0.1'
const SITE = path.join(__dirname, 'site')

const server = http.createServer((req, res) => {
  const urlPath = req.url === '/' ? '/index.html' : req.url
  const filePath = path.join(SITE, path.normalize(urlPath))

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404)
      res.end('Not found')

      return
    }

    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(data)
  })
})

server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`Serving ${SITE} at http://${HOST}:${PORT}`)
})
