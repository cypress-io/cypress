import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import http from 'http'
import os from 'os'
import path from 'path'
import fs from 'fs-extra'
import type { AddressInfo } from 'net'
import { strictAgent } from '@packages/network'
import { sendFile } from '../../../../lib/cloud/upload/send_file'

type Received = { method?: string, url?: string, body: string }

describe('cloud/upload/send_file', () => {
  let tmpDir: string
  let filePath: string
  let server: http.Server
  let received: Received[]

  const listen = (): Promise<number> => {
    return new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve((server.address() as AddressInfo).port))
    })
  }

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'send-file-'))
    filePath = path.join(tmpDir, 'screenshot.png')
    await fs.writeFile(filePath, 'file contents')

    received = []
    server = http.createServer((req, res) => {
      let body = ''

      req.on('data', (chunk) => body += chunk)
      req.on('end', () => {
        received.push({ method: req.method, url: req.url, body })
        res.end()
      })
    })
  })

  afterEach(async () => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    server.close()
    await fs.remove(tmpDir)
  })

  it('PUTs the file contents through strictAgent', async () => {
    const addRequest = vi.spyOn(strictAgent, 'addRequest')
    const port = await listen()

    await sendFile(filePath, `http://127.0.0.1:${port}/upload?sig=abc`)

    expect(addRequest).toHaveBeenCalled()
    expect(received).toEqual([{ method: 'PUT', url: '/upload?sig=abc', body: 'file contents' }])
  })

  it('sends the request through HTTP_PROXY', async () => {
    const port = await listen()

    vi.stubEnv('HTTP_PROXY', `http://127.0.0.1:${port}`)
    vi.stubEnv('NO_PROXY', '')

    await sendFile(filePath, 'http://uploads.example.test/upload?sig=abc')

    expect(received).toEqual([{ method: 'PUT', url: 'http://uploads.example.test/upload?sig=abc', body: 'file contents' }])
  })
})
