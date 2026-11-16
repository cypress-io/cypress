import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { iframesController } from '../../lib/controllers/iframes'
import files from '../../lib/controllers/files'
import { GracefulExit } from '../../lib/util/graceful-exit'
import Bluebird from 'bluebird'

async function rejectionOf (promise: Promise<unknown>) {
  try {
    await promise
  } catch (e) {
    return e
  }

  throw new Error('expected promise to reject')
}

describe('controllers/iframes', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('e2e', () => {
    it('sets Origin-Agent-Cluster response header to false', () => {
      vi.spyOn(files, 'handleIframe').mockImplementation(async () => {})

      const mockReq = {}
      const mockRes = {
        setHeader: vi.fn(),
      }

      const controllerOptions = {
        getSpec: vi.fn(),
        remoteStates: vi.fn(),
        config: {},
      }

      iframesController.e2e(controllerOptions as any, mockReq as any, mockRes as any)

      expect(mockRes.setHeader).toHaveBeenCalledWith('Origin-Agent-Cluster', '?0')
      expect(files.handleIframe).toHaveBeenCalledWith(
        mockReq, mockRes, controllerOptions.config, controllerOptions.remoteStates, expect.objectContaining({
          specType: 'integration',
        }),
      )

      // sinon.match({ specFilter: undefined }) also accepts the key being absent
      expect(vi.mocked(files.handleIframe).mock.calls[0][4].specFilter).toBeUndefined()
    })
  })

  describe('component', () => {
    let nodeProxy
    let proxyCallback
    let isShuttingDown: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      isShuttingDown = vi.spyOn(GracefulExit, 'isShuttingDown', 'get').mockReturnValue(false)
      // @ts-expect-error - a native promise stands in for Bluebird's
      vi.spyOn(Bluebird, 'delay').mockResolvedValue(undefined)
      proxyCallback = null
      nodeProxy = {
        web: vi.fn((req, res, _options, cb) => {
          proxyCallback = cb
        }),
      }
    })

    it('throws when in run mode (isTextTerminal) and dev server connection is refused (ECONNREFUSED)', async () => {
      const config = { isTextTerminal: true, devServerPublicPathRoute: '/__cypress/' }
      const req = { query: {}, params: { 0: 'foo.js' }, url: '', headers: {} }
      const res = {}

      iframesController.component({ config, nodeProxy } as any, req as any, res as any)

      expect(nodeProxy.web).toHaveBeenCalledOnce()
      const err: NodeJS.ErrnoException = new Error('connect ECONNREFUSED 127.0.0.1:8080')

      err.code = 'ECONNREFUSED'

      expect(await rejectionOf(proxyCallback(err))).toBe(err)
    })

    it('throws when in run mode (isTextTerminal) and dev server connection is reset (ECONNRESET)', async () => {
      const config = { isTextTerminal: true, devServerPublicPathRoute: '/__cypress/' }
      const req = { query: {}, params: { 0: 'foo.js' }, url: '', headers: {} }
      const res = {}

      iframesController.component({ config, nodeProxy } as any, req as any, res as any)

      expect(nodeProxy.web).toHaveBeenCalledOnce()
      const err: NodeJS.ErrnoException = new Error('connect ECONNRESET 127.0.0.1:8080')

      err.code = 'ECONNRESET'

      expect(await rejectionOf(proxyCallback(err))).toBe(err)
    })

    it('does not throw when the process is already shutting down', async () => {
      isShuttingDown.mockReturnValue(true)
      const config = { isTextTerminal: true, devServerPublicPathRoute: '/__cypress/' }
      const req = { query: {}, params: { 0: 'foo.js' }, url: '', headers: {} }
      const res = { destroy: vi.fn() }

      iframesController.component({ config, nodeProxy } as any, req as any, res as any)

      await expect(proxyCallback(new Error('socket hang up'))).resolves.toBeUndefined()
      expect(res.destroy).toHaveBeenCalled()
    })

    it('does not throw when shutdown starts shortly after the proxy error', async () => {
      isShuttingDown.mockReturnValueOnce(false).mockReturnValueOnce(false).mockReturnValue(true)
      const config = { isTextTerminal: true, devServerPublicPathRoute: '/__cypress/' }
      const req = { query: {}, params: { 0: 'foo.js' }, url: '', headers: {} }
      const res = { destroy: vi.fn() }

      iframesController.component({ config, nodeProxy } as any, req as any, res as any)

      await expect(proxyCallback(new Error('socket hang up'))).resolves.toBeUndefined()
      expect(res.destroy).toHaveBeenCalled()
    })

    it('does not throw when in open mode and dev server connection is refused (ECONNREFUSED)', async () => {
      const config = { isTextTerminal: false, devServerPublicPathRoute: '/__cypress/' }
      const req = { query: {}, params: { 0: 'foo.js' }, url: '', headers: {} }
      const res = {}

      iframesController.component({ config, nodeProxy } as any, req as any, res as any)

      expect(nodeProxy.web).toHaveBeenCalledOnce()
      const err: NodeJS.ErrnoException = new Error('connect ECONNREFUSED 127.0.0.1:8080')

      err.code = 'ECONNREFUSED'

      await expect(proxyCallback(err)).resolves.toBeUndefined()
      expect(isShuttingDown).not.toHaveBeenCalled()
    })
  })
})
