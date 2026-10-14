import http from 'http'
import os from 'os'
import path from 'path'
import fs from 'fs'
import { EventEmitter } from 'events'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { stripAnsi } from '@packages/errors'
import * as fileServer from '../../lib/file_server'

// Builds a fake http.Server that fails its first `failCount` listen() calls
// with a bind 'error' event (defaulting to EADDRINUSE, mirroring a transient
// loopback bind race), then succeeds. Each fake exposes `listenAttempts` so
// tests can assert retries.
function fakeServerFactory (failCount: number, code = 'EADDRINUSE') {
  const srv: any = new EventEmitter()

  srv.listenAttempts = 0

  srv.listen = (_port: number, _host: string, cb: () => void) => {
    srv.listenAttempts++

    if (srv.listenAttempts <= failCount) {
      const err = new Error(`listen ${code}: address bind failed 127.0.0.1`) as NodeJS.ErrnoException

      err.code = code

      // emit asynchronously, as Node does for a real bind failure
      process.nextTick(() => srv.emit('error', err))

      return srv
    }

    process.nextTick(cb)

    return srv
  }

  srv.address = () => ({ port: 9999 })
  // allowDestroy assigns this; stub it so close() is callable
  srv.destroy = (cb: () => void) => cb && cb()

  return srv
}

describe('lib/file_server', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('.create', () => {
    it('resolves with a working file server on first attempt', async () => {
      const srv = fakeServerFactory(0)

      vi.spyOn(http, 'createServer').mockReturnValue(srv)

      const server = await fileServer.create('/dev/null')

      expect(srv.listenAttempts).toBe(1)
      expect(server.port()).toBe(9999)
      expect(server.address()).toBe('http://localhost:9999')
      expect(server.token).toHaveLength(64)
    })

    it('retries on a fresh ephemeral port after a transient bind failure and resolves', async () => {
      const srv = fakeServerFactory(2)

      vi.spyOn(http, 'createServer').mockReturnValue(srv)

      const server = await fileServer.create('/dev/null', { maxAttempts: 3 })

      expect(srv.listenAttempts, 'should retry until a bind succeeds').toBe(3)
      expect(server.port()).toBe(9999)
    })

    it('removes the bind-phase error handler once listening', async () => {
      const srv = fakeServerFactory(1)

      vi.spyOn(http, 'createServer').mockReturnValue(srv)

      await fileServer.create('/dev/null', { maxAttempts: 3 })

      // the once('error') handler must not linger and intercept later runtime
      // socket errors after a successful bind
      expect(srv.listenerCount('error')).toBe(0)
    })

    it('rejects with FILE_SERVER_COULD_NOT_LISTEN after exhausting attempts instead of throwing uncaught', async () => {
      const srv = fakeServerFactory(Infinity)

      vi.spyOn(http, 'createServer').mockReturnValue(srv)

      let caught: any

      try {
        await fileServer.create('/dev/null', { maxAttempts: 3 })
      } catch (err) {
        caught = err
      }

      expect(srv.listenAttempts, 'should attempt exactly maxAttempts times').toBe(3)
      expect(caught, 'create() should reject, not throw uncaught').toEqual(expect.anything())
      expect(caught.type).toBe('FILE_SERVER_COULD_NOT_LISTEN')
      expect(caught.isCypressErr).toBe(true)

      // surfaces the attempt count and the underlying error to the user.
      // strip ANSI since the highlighted count is wrapped in color codes.
      const message = stripAnsi(caught.message)

      expect(message).toContain('3 attempts')
      expect(message).toContain('EADDRINUSE')
    })

    it('rejects a non-EADDRINUSE bind error immediately without retrying or wrapping it', async () => {
      // retrying a fresh port can't fix a permission error, and the branded
      // "port already in use" copy would be wrong — so surface it as-is
      const srv = fakeServerFactory(Infinity, 'EACCES')

      vi.spyOn(http, 'createServer').mockReturnValue(srv)

      let caught: any

      try {
        await fileServer.create('/dev/null', { maxAttempts: 3 })
      } catch (err) {
        caught = err
      }

      expect(srv.listenAttempts, 'should not retry a non-EADDRINUSE error').toBe(1)
      expect(caught, 'create() should reject, not throw uncaught').toEqual(expect.anything())
      expect(caught.type, 'should reject the raw error, not the branded one').toBeUndefined()
      expect(caught.code).toBe('EACCES')
    })
  })

  // Exercises the real http.Server bind/serve path end-to-end (no stub),
  // covering the production listen(0) on 127.0.0.1 and onRequest handling.
  describe('with a real server', () => {
    let server: fileServer.FileServer
    let tmpDir: string

    beforeEach(async () => {
      tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'cy-file-server-'))
      await fs.promises.writeFile(path.join(tmpDir, 'hello.txt'), 'world')

      server = await fileServer.create(tmpDir)
    })

    afterEach(async () => {
      await server?.close()
      if (tmpDir) {
        await fs.promises.rm(tmpDir, { recursive: true, force: true })
      }
    })

    it('binds a real ephemeral port and serves files to authorized requests', async () => {
      expect(server.port()).toBeGreaterThan(0)

      const { statusCode, body } = await new Promise<{ statusCode?: number, body: string }>((resolve, reject) => {
        http.get(`${server.address()}/hello.txt`, { headers: { 'x-cypress-authorization': server.token } }, (res) => {
          let body = ''

          res.on('data', (chunk) => body += chunk)
          res.on('end', () => resolve({ statusCode: res.statusCode, body }))
        }).on('error', reject)
      })

      expect(statusCode).toBe(200)
      expect(body).toBe('world')
    })

    it('rejects requests missing the authorization token with a 401', async () => {
      const statusCode = await new Promise<number | undefined>((resolve, reject) => {
        http.get(`${server.address()}/hello.txt`, (res) => {
          resolve(res.statusCode)
        }).on('error', reject)
      })

      expect(statusCode).toBe(401)
    })
  })
})
