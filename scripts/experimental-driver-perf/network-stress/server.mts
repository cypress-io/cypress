// Serves the network stress page and an API whose responses are as large and as many as a
// test asks for, so specs can load the network without depending on anything outside
// this machine. No dependencies, so it runs straight from Node.
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'

const port = Number(process.env.PORT ?? 3500)
const pagePath = path.join(import.meta.dirname, 'app', 'index.html')

// Records look like the rows of a real API, so parsing a large body costs what it would
// in an app, unlike one long string
const record = (id: number) => {
  return {
    id,
    name: `Item ${id}`,
    email: `user${id}@example.com`,
    createdAt: new Date(Date.UTC(2026, 0, 1) + id * 60_000).toISOString(),
    tags: ['alpha', 'beta', 'gamma'].slice(0, (id % 3) + 1),
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.',
  }
}

const jsonBodies = new Map<number, Buffer>()

// Records are added until the body reaches the requested size, so the body is at least
// that many bytes and at most one record over
const jsonBody = (bytes: number) => {
  let body = jsonBodies.get(bytes)

  if (!body) {
    const records: ReturnType<typeof record>[] = []
    let size = 2

    while (size < bytes) {
      const next = record(records.length)

      size += Buffer.byteLength(JSON.stringify(next)) + 1
      records.push(next)
    }

    body = Buffer.from(JSON.stringify(records))
    jsonBodies.set(bytes, body)
  }

  return body
}

const textBodies = new Map<number, Buffer>()

const textBody = (bytes: number) => {
  let body = textBodies.get(bytes)

  if (!body) {
    body = Buffer.alloc(bytes, 'abcdefghijklmnopqrstuvwxyz0123456789\n')
    textBodies.set(bytes, body)
  }

  return body
}

const send = (res: http.ServerResponse, status: number, type: string, body: Buffer | string) => {
  res.writeHead(status, {
    'Content-Type': type,
    'Content-Length': Buffer.byteLength(body),
    // Every request goes over the network, as the specs count them
    'Cache-Control': 'no-store',
  })

  res.end(body)
}

const readBodyLength = async (req: http.IncomingMessage) => {
  let length = 0

  for await (const chunk of req) {
    length += chunk.length
  }

  return length
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${port}`)
  const bytes = Math.max(0, Number(url.searchParams.get('bytes') ?? 100))

  try {
    if (url.pathname === '/' || url.pathname === '/index.html') {
      send(res, 200, 'text/html; charset=utf-8', await fs.promises.readFile(pagePath))

      return
    }

    if (url.pathname === '/health') {
      send(res, 200, 'text/plain', 'ok')

      return
    }

    if (url.pathname === '/api/json' && req.method === 'GET') {
      send(res, 200, 'application/json', jsonBody(bytes))

      return
    }

    if (url.pathname === '/api/text' && req.method === 'GET') {
      send(res, 200, 'text/plain', textBody(bytes))

      return
    }

    if (url.pathname === '/api/upload' && req.method === 'POST') {
      const received = await readBodyLength(req)

      send(res, 200, 'application/json', JSON.stringify({ received }))

      return
    }

    send(res, 404, 'text/plain', 'not found')
  } catch (err) {
    send(res, 500, 'text/plain', String(err))
  }
})

server.listen(port, () => {
  process.stdout.write(`network stress server on http://localhost:${port}\n`)
})
