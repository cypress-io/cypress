import { describe, expect, it, beforeEach, jest } from '@jest/globals'
import type { DataContext } from '../../../src'
import { createTestDataContext } from '../helper'

describe('HtmlDataSource', () => {
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
