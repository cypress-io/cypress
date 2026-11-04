import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest'

const processEnv = process.env

describe('lib/cloud/routes', () => {
  const routes = async () => {
    vi.resetModules()

    return import('../../../lib/cloud/routes')
  }

  // A plain-object env keeps `undefined` as-is; the real process.env would coerce it to 'undefined'
  beforeEach(() => {
    process.env = { ...processEnv }
    delete process.env.CYPRESS_INTERNAL_CLOUD_WORKSPACE_NUM
  })

  afterEach(() => {
    process.env = processEnv
  })

  describe('api routes', () => {
    let apiRoutes: Awaited<ReturnType<typeof routes>>['apiRoutes']

    beforeAll(async () => {
      apiRoutes = (await routes()).apiRoutes
    })

    it('api', () => {
      expect(apiRoutes.api()).toBe('http://localhost:1234/')
    })

    it('auth', () => {
      expect(apiRoutes.auth()).toBe('http://localhost:1234/auth')
    })

    it('ping', () => {
      expect(apiRoutes.ping()).toBe('http://localhost:1234/ping')
    })

    it('runs', () => {
      expect(apiRoutes.runs()).toBe('http://localhost:1234/runs')
    })

    it('instances', () => {
      expect(apiRoutes.instances(123)).toBe('http://localhost:1234/runs/123/instances')
    })

    it('instanceTests', () => {
      expect(apiRoutes.instanceTests(123)).toBe('http://localhost:1234/instances/123/tests')
    })

    it('instanceResults', () => {
      expect(apiRoutes.instanceResults(123)).toBe('http://localhost:1234/instances/123/results')
    })

    it('exceptions', () => {
      expect(apiRoutes.exceptions()).toBe('http://localhost:1234/exceptions')
    })
  })

  describe('api url', () => {
    let oldCypressInternalEnv

    beforeEach(() => {
      oldCypressInternalEnv = process.env.CYPRESS_INTERNAL_ENV
    })

    afterEach(() => {
      if (oldCypressInternalEnv) {
        process.env.CYPRESS_INTERNAL_ENV = oldCypressInternalEnv
      } else {
        delete process.env.CYPRESS_INTERNAL_ENV
      }
    })

    it('supports development environment', async () => {
      process.env.CYPRESS_INTERNAL_ENV = 'development'

      expect((await routes()).apiRoutes.api()).toBe('http://localhost:1234/')
    })

    it.each([0, 1, 2, 3, 4, 5])('targets the API in development workspace %s', async (workspace) => {
      process.env.CYPRESS_INTERNAL_ENV = 'development'
      delete process.env.CYPRESS_CONFIG_ENV
      process.env.CYPRESS_INTERNAL_CLOUD_WORKSPACE_NUM = String(workspace)

      const loaded = await routes()

      expect(loaded.getApiUrl()).toBe(`http://localhost:${workspace * 10000 + 1234}/`)
      expect(loaded.apiRoutes.instances(123)).toBe(`http://localhost:${workspace * 10000 + 1234}/runs/123/instances`)
    })

    it('uses the workspace when development is selected by default', async () => {
      delete process.env.CYPRESS_CONFIG_ENV
      delete process.env.CYPRESS_INTERNAL_ENV
      process.env.CYPRESS_INTERNAL_CLOUD_WORKSPACE_NUM = '4'

      expect((await routes()).getApiUrl()).toBe('http://localhost:41234/')
    })

    it.each(['production', 'staging', 'test'])('ignores the workspace when CYPRESS_CONFIG_ENV selects %s', async (environment) => {
      process.env.CYPRESS_INTERNAL_ENV = 'development'
      process.env.CYPRESS_CONFIG_ENV = environment
      process.env.CYPRESS_INTERNAL_CLOUD_WORKSPACE_NUM = 'invalid'

      const expected = {
        production: 'https://api.cypress.io/',
        staging: 'https://api-staging.cypress.io/',
        test: 'http://localhost:1234/',
      }

      expect((await routes()).getApiUrl()).toBe(expected[environment])
    })

    it.each(['', '6', '7'])('rejects an invalid workspace %j in development', async (workspace) => {
      process.env.CYPRESS_INTERNAL_ENV = 'development'
      delete process.env.CYPRESS_CONFIG_ENV
      process.env.CYPRESS_INTERNAL_CLOUD_WORKSPACE_NUM = workspace

      const loaded = await routes()

      expect(() => loaded.getApiUrl()).toThrow('CYPRESS_INTERNAL_CLOUD_WORKSPACE_NUM must be an integer from 0 to 5')
    })

    it('resolves workspace changes per call', async () => {
      process.env.CYPRESS_INTERNAL_ENV = 'development'
      delete process.env.CYPRESS_CONFIG_ENV
      process.env.CYPRESS_INTERNAL_CLOUD_WORKSPACE_NUM = '0'

      const loaded = await routes()

      expect(loaded.getApiUrl()).toBe('http://localhost:1234/')

      process.env.CYPRESS_INTERNAL_CLOUD_WORKSPACE_NUM = '4'

      expect(loaded.getApiUrl()).toBe('http://localhost:41234/')
    })

    it('supports staging environment', async () => {
      process.env['CYPRESS_INTERNAL_ENV'] = 'staging'

      expect((await routes()).apiRoutes.api()).toBe('https://api-staging.cypress.io/')
    })

    it('supports production environment', async () => {
      process.env.CYPRESS_INTERNAL_ENV = 'production'

      expect((await routes()).apiRoutes.api()).toBe('https://api.cypress.io/')
    })

    it('supports test environment', async () => {
      ;(process.env as Record<string, string | undefined>)['CYPRESS_INTERNAL_ENV'] = 'test'

      expect((await routes()).apiRoutes.api()).toBe('http://localhost:1234/')
    })

    it('defaults to development', async () => {
      process.env.CYPRESS_CONFIG_ENV = undefined
      process.env.CYPRESS_INTERNAL_ENV = undefined

      expect((await routes()).apiRoutes.api()).toBe('http://localhost:1234/')
    })

    it('honors CYPRESS_CONFIG_ENV', async () => {
      process.env.CYPRESS_CONFIG_ENV = 'staging'

      ;(process.env as Record<string, string | undefined>)['CYPRESS_INTERNAL_ENV'] = 'test'

      expect((await routes()).apiRoutes.api()).toBe('https://api-staging.cypress.io/')
    })

    it('resolves per call rather than when the module is evaluated', async () => {
      process.env.CYPRESS_INTERNAL_ENV = 'staging'

      const loaded = await routes()

      expect(loaded.apiRoutes.api()).toBe('https://api-staging.cypress.io/')

      process.env.CYPRESS_INTERNAL_ENV = 'production'

      expect(loaded.apiRoutes.api()).toBe('https://api.cypress.io/')
      expect(loaded.getApiUrl()).toBe('https://api.cypress.io/')
    })
  })
})
