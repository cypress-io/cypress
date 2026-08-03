const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = 5599
const HOST = '127.0.0.1'
const PUBLIC = path.join(__dirname, 'public')

function readBody (req) {
  return new Promise((resolve) => {
    let data = ''

    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => resolve(data))
  })
}

const server = http.createServer(async (req, res) => {
  // The QUERY HTTP method (like GET, but carries a request body describing the
  // query). We echo the parsed body back so the client can render results.
  if (req.method === 'QUERY' && req.url === '/api/search') {
    const raw = await readBody(req)
    let query = {}

    try {
      query = JSON.parse(raw || '{}')
    } catch (e) {
      query = { raw }
    }

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      method: req.method,
      query,
      results: [
        { id: 1, name: `${query.term || 'all'} result A` },
        { id: 2, name: `${query.term || 'all'} result B` },
      ],
    }))

    return
  }

  // Serve the AUT page.
  const urlPath = req.url === '/' ? '/index.html' : req.url
  const filePath = path.join(PUBLIC, path.normalize(urlPath))

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
  console.log(`QUERY demo server at http://${HOST}:${PORT}`)
})
