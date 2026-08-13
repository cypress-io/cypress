// Probe: does CDP Fetch with `requestStage: Response` buffer a streaming
// response? Runs the same origin twice — once with Request-stage pauses only,
// once with Request + Response (what Cypress enables under
// CYPRESS_INTERNAL_DISABLE_PROXY=1) — and reports when the page saw each chunk.
import { spawn } from 'child_process'
import WebSocket from 'ws'
import http from 'http'

const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const PORT = 9334
const ORIGIN_PORT = 8558

const origin = http.createServer(async (req, res) => {
  if (req.url === '/') {
    res.setHeader('content-type', 'text/html')

    return res.end(`<html><body><script>
      window.read = async () => {
        const started = performance.now()
        const res = await fetch('/stream')
        const reader = res.body.getReader()
        const arrivals = []
        for (;;) {
          const { done } = await reader.read()
          if (done) break
          arrivals.push(Math.round(performance.now() - started))
        }
        return arrivals
      }
    </script></body></html>`)
  }

  if (req.url === '/stream') {
    res.setHeader('content-type', 'application/grpc-web+proto')
    for (let i = 0; i < 3; i++) {
      res.write(Buffer.from([0, 0, 0, 0, 4, 116, 101, 115, 116]))
      await new Promise((r) => setTimeout(r, 300))
    }

    return res.end()
  }

  res.statusCode = 404
  res.end()
})

await new Promise((r) => origin.listen(ORIGIN_PORT, r))

const run = async (patterns, label) => {
  const chrome = spawn(CHROME, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new', '--no-sandbox', '--disable-gpu',
    `--user-data-dir=/tmp/cdp-stream-${label}`,
    'about:blank',
  ], { stdio: 'ignore' })

  const getJson = async (path) => {
    for (let i = 0; i < 60; i++) {
      try {
        return await new Promise((resolve, reject) => {
          http.get(`http://127.0.0.1:${PORT}${path}`, (res) => {
            const chunks = []

            res.on('data', (c) => chunks.push(c))
            res.on('end', () => resolve(JSON.parse(Buffer.concat(chunks).toString())))
          }).on('error', reject)
        })
      } catch {
        await new Promise((r) => setTimeout(r, 200))
      }
    }

    throw new Error('chrome never came up')
  }

  const { webSocketDebuggerUrl } = await getJson('/json/version')
  const ws = new WebSocket(webSocketDebuggerUrl)

  await new Promise((r) => ws.on('open', r))

  let nextId = 1
  const pending = new Map()
  const send = (method, params, sessionId) => {
    const id = nextId++

    ws.send(JSON.stringify({ id, method, params, sessionId }))

    return new Promise((resolve, reject) => pending.set(id, { resolve, reject }))
  }

  ws.on('message', async (raw) => {
    const msg = JSON.parse(raw.toString())

    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)

      pending.delete(msg.id)

      return msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result)
    }

    if (msg.method === 'Fetch.requestPaused') {
      const e = msg.params

      if (e.responseStatusCode !== undefined) {
        // mirror Cypress: pull the whole body, then continue
        await send('Fetch.getResponseBody', { requestId: e.requestId }, msg.sessionId).catch(() => {})
        await send('Fetch.continueResponse', { requestId: e.requestId }, msg.sessionId).catch(() => {})
      } else {
        await send('Fetch.continueRequest', { requestId: e.requestId }, msg.sessionId).catch(() => {})
      }
    }
  })

  const targets = await send('Target.getTargets')
  const page = targets.targetInfos.find((t) => t.type === 'page')
  const { sessionId } = await send('Target.attachToTarget', { targetId: page.targetId, flatten: true })

  await send('Runtime.enable', {}, sessionId)
  await send('Page.enable', {}, sessionId)

  if (patterns) {
    await send('Fetch.enable', { patterns }, sessionId)
  }

  await send('Page.navigate', { url: `http://127.0.0.1:${ORIGIN_PORT}/` }, sessionId)
  await new Promise((r) => setTimeout(r, 1500))

  const result = await send('Runtime.evaluate', {
    expression: 'window.read()',
    awaitPromise: true,
    returnByValue: true,
  }, sessionId)

  console.log(`${label.padEnd(28)} chunk arrivals (ms): ${JSON.stringify(result.result.value)}`)

  ws.close()
  chrome.kill()
  await new Promise((r) => setTimeout(r, 1000))
}

await run(null, 'Fetch disabled')
await run([{ requestStage: 'Request' }], 'Request stage only')
await run([{ requestStage: 'Request' }, { requestStage: 'Response' }], 'Request + Response stages')

origin.close()
process.exit(0)
