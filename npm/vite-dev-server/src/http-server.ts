// https://developer.mozilla.org/en-US/docs/Learn/Server-side/Node_server_without_framework

import http, { RequestListener } from 'http'
import fs from 'fs/promises'
import path from 'path'

export default function (port: number, root: string, base: string, exceptions: Record<string, RequestListener>) {
  return http.createServer(async function (request, response) {
    let filePath = request.url?.startsWith(base) ? request.url?.substring(base.length) : request.url || ''

    if (filePath === './') {
      filePath = './index.html'
    }

    let extname = String(path.extname(filePath)).toLowerCase()
    let mimeTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.wav': 'audio/wav',
      '.mp4': 'video/mp4',
      '.woff': 'application/font-woff',
      '.ttf': 'application/font-ttf',
      '.eot': 'application/vnd.ms-fontobject',
      '.otf': 'application/font-otf',
      '.wasm': 'application/wasm',
    }

    let contentType = mimeTypes[extname] || 'application/octet-stream'

    if (exceptions[filePath]) {
      exceptions[filePath](request, response)

      return
    }

    if (filePath.startsWith('@fs/')) {
      filePath = filePath.substring(3)
    } else {
      filePath = path.resolve(root, filePath)
    }

    try {
      const content = await fs.readFile(filePath)

      response.writeHead(200, { 'Content-Type': contentType })
      response.end(content, 'utf-8')
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        response.writeHead(404, { 'Content-Type': 'text/html' })
        response.end(`<h1>404</h1>${filePath}`, 'utf-8')
      } else {
        response.writeHead(500)
        response.end(`Sorry, check with the site admin for error: ${error.code} ..\n`)
      }
    }
  }).listen(port)
}
