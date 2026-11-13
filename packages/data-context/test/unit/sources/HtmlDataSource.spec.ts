import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals'
import type { DataContext } from '../../../src'
import { createTestDataContext } from '../helper'
import { getPathToDist } from '@packages/resolve-dist'

describe('HtmlDataSource', () => {
  describe('#fetchAppHtml', () => {
    let ctx: DataContext
    let readFile: jest.SpiedFunction<any>
    let originalViteDev: string | undefined

    const appIndexHtml = getPathToDist('app', 'index.html')
    const enoent = (message: string) => Object.assign(new Error(message), { code: 'ENOENT' })

    beforeEach(() => {
      originalViteDev = process.env.CYPRESS_INTERNAL_VITE_DEV
      delete process.env.CYPRESS_INTERNAL_VITE_DEV

      ctx = createTestDataContext('open')
      jest.spyOn(ctx.project, 'projectTitle').mockReturnValue('my-project')
      readFile = jest.spyOn(ctx.fs, 'readFile')

      // After creating the context, so only timers started by fetchAppHtml are faked
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
      jest.restoreAllMocks()

      if (originalViteDev === undefined) {
        delete process.env.CYPRESS_INTERNAL_VITE_DEV
      } else {
        process.env.CYPRESS_INTERNAL_VITE_DEV = originalViteDev
      }
    })

    it('retries until index.html can be read and fills in the project title', async () => {
      readFile
      .mockRejectedValueOnce(enoent('ENOENT 1'))
      .mockRejectedValueOnce(enoent('ENOENT 2'))
      .mockResolvedValueOnce('<html><head><title>Cypress</title></head></html>')

      const html = ctx.html.fetchAppHtml()

      await jest.advanceTimersByTimeAsync(2000)

      await expect(html).resolves.toBe('<html><head><title>my-project</title></head></html>')
      expect(readFile).toHaveBeenCalledTimes(3)
      expect(readFile).toHaveBeenNthCalledWith(1, appIndexHtml, 'utf8')
      expect(readFile).toHaveBeenNthCalledWith(3, appIndexHtml, 'utf8')
    })

    it('inserts the project title literally and HTML-escaped', async () => {
      jest.mocked(ctx.project.projectTitle).mockReturnValue(`a$&b$'<i>&"`)
      readFile.mockResolvedValueOnce('<title>Cypress</title>')

      await expect(ctx.html.fetchAppHtml()).resolves.toBe('<title>a$&amp;b$&#39;&lt;i&gt;&amp;&quot;</title>')
    })

    it('rethrows an error other than ENOENT without retrying', async () => {
      const eacces = Object.assign(new Error('EACCES'), { code: 'EACCES' })

      readFile.mockRejectedValueOnce(eacces)

      await expect(ctx.html.fetchAppHtml()).rejects.toBe(eacces)
      expect(readFile).toHaveBeenCalledTimes(1)
      expect(jest.getTimerCount()).toBe(0)
    })

    it('rejects with the last error after 5 failed attempts without waiting after the last one', async () => {
      for (let i = 1; i <= 5; i++) {
        readFile.mockRejectedValueOnce(enoent(`ENOENT ${i}`))
      }

      const html = ctx.html.fetchAppHtml()
      const assertion = expect(html).rejects.toThrow('ENOENT 5')

      // 4 waits of 1s between 5 attempts
      await jest.advanceTimersByTimeAsync(4000)
      await assertion

      expect(readFile).toHaveBeenCalledTimes(5)
      expect(jest.getTimerCount()).toBe(0)
    })

    it('fetches from the Vite dev server when CYPRESS_INTERNAL_VITE_DEV is set', async () => {
      process.env.CYPRESS_INTERNAL_VITE_DEV = '1'
      const fetch = jest.spyOn(ctx.util, 'fetch').mockResolvedValue({ text: async () => '<html>dev</html>' } as any)

      await expect(ctx.html.fetchAppHtml()).resolves.toBe('<html>dev</html>')
      expect(fetch).toHaveBeenCalledTimes(1)
      expect(readFile).not.toHaveBeenCalled()
    })
  })

  describe('#launchpadHtml', () => {
    let ctx: DataContext
    let readFile: jest.SpiedFunction<any>
    const envKeys = ['CYPRESS_INTERNAL_VITE_DEV', 'CYPRESS_INTERNAL_VITE_LAUNCHPAD_PORT', 'CYPRESS_INTERNAL_ENABLE_TELEMETRY'] as const
    let originalEnv: Partial<Record<typeof envKeys[number], string>>

    beforeEach(() => {
      originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]))
      delete process.env.CYPRESS_INTERNAL_VITE_DEV
      process.env.CYPRESS_INTERNAL_ENABLE_TELEMETRY = 'true'

      ctx = createTestDataContext('open')
      readFile = jest.spyOn(ctx.fs, 'readFile').mockResolvedValue('<html><body><div id="app"></div></body></html>' as never)
    })

    afterEach(() => {
      jest.restoreAllMocks()

      for (const key of envKeys) {
        if (originalEnv[key] === undefined) {
          delete process.env[key]
        } else {
          process.env[key] = originalEnv[key]
        }
      }
    })

    it('bootstraps browser telemetry into the built launchpad page', async () => {
      const html = await ctx.html.launchpadHtml()

      expect(readFile).toHaveBeenCalledWith(getPathToDist('launchpad', 'index.html'), 'utf8')
      expect(html).toContain('window.__CYPRESS_TELEMETRY__ = {"context":{},"resources":{},"isVerbose":false}')
      expect(html.indexOf('__CYPRESS_TELEMETRY__')).toBeLessThan(html.indexOf('<div id="app">'))
    })

    it('fetches the launchpad page from the Vite dev server when CYPRESS_INTERNAL_VITE_DEV is set', async () => {
      process.env.CYPRESS_INTERNAL_VITE_DEV = '1'
      process.env.CYPRESS_INTERNAL_VITE_LAUNCHPAD_PORT = '3333'
      const fetch = jest.spyOn(ctx.util, 'fetch').mockResolvedValue({ text: async () => '<body>dev</body>' } as any)

      await expect(ctx.html.launchpadHtml()).resolves.toContain('__CYPRESS_TELEMETRY__')
      expect(fetch).toHaveBeenCalledWith('http://localhost:3333/__launchpad/index.html', { method: 'GET' })
      expect(readFile).not.toHaveBeenCalled()
    })

    it('adds no bootstrap when telemetry is disabled', async () => {
      delete process.env.CYPRESS_INTERNAL_ENABLE_TELEMETRY

      await expect(ctx.html.launchpadHtml()).resolves.not.toContain('__CYPRESS_TELEMETRY__')
    })
  })

  describe('#makeServeConfig', () => {
    let ctx: DataContext
    let cachedConfig: Record<string, any>

    const decode = (base64Config: string) => JSON.parse(Buffer.from(base64Config, 'base64').toString())

    beforeEach(() => {
      ctx = createTestDataContext('open')
      cachedConfig = {
        namespace: '__cypress',
        env: { apiKey: 'env-secret' },
        rawJson: { env: { apiKey: 'env-secret' }, envFile: { fromEnvFile: 'env-secret' } },
        resolved: {
          baseUrl: { value: 'http://localhost:3000', from: 'config' },
          env: { apiKey: { value: 'env-secret', from: 'config' } },
        },
      }

      ctx._apis.projectApi.getConfig = jest.fn().mockReturnValue({}) as any
      ctx._apis.projectApi.getCurrentBrowser = jest.fn().mockReturnValue(undefined) as any
      ctx._apis.projectApi.getRemoteStates = jest.fn().mockReturnValue(undefined) as any
      jest.spyOn(ctx.lifecycleManager, 'projectTitle', 'get').mockReturnValue('project')
      jest.spyOn(ctx.project, 'getConfig').mockResolvedValue({ ...cachedConfig } as any)
    })

    it('omits env, rawJson, and resolved from the served config', async () => {
      const { base64Config } = await ctx.html.makeServeConfig()
      const cfg = decode(base64Config)

      expect(cfg.env).toBeUndefined()
      expect(cfg.rawJson).toBeUndefined()
      expect(cfg.resolved).toBeUndefined()
      expect(Buffer.from(base64Config, 'base64').toString()).not.toContain('env-secret')
    })

    it('leaves resolved.env on the cached config', async () => {
      await ctx.html.makeServeConfig()

      expect(cachedConfig.resolved.env).toEqual({ apiKey: { value: 'env-secret', from: 'config' } })
    })
  })
})
