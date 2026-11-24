import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('CloudRequest development workspace', () => {
  // The API URL is read when routes loads, so each test imports it after stubbing the env
  const createCloudRequest = async (...args: Parameters<typeof import('../../../../lib/cloud/api/cloud_request').createCloudRequest>) => {
    vi.resetModules()

    return (await import('../../../../lib/cloud/api/cloud_request')).createCloudRequest(...args)
  }

  beforeEach(() => {
    vi.stubEnv('CYPRESS_INTERNAL_ENV', 'development')
    vi.stubEnv('CYPRESS_CONFIG_ENV', undefined)
    vi.stubEnv('CYPRESS_INTERNAL_CLOUD_WORKSPACE_NUM', '4')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('uses the workspace API for the default base URL', async () => {
    expect((await createCloudRequest()).defaults.baseURL).toBe('http://localhost:41234/')
  })

  it.each(['http://localhost:9999/custom', 'https://custom.example.com'])('preserves the explicit base URL %s', async (baseURL) => {
    expect((await createCloudRequest({ baseURL })).defaults.baseURL).toBe(baseURL)
  })

  it('honors the config environment override', async () => {
    vi.stubEnv('CYPRESS_CONFIG_ENV', 'staging')

    expect((await createCloudRequest()).defaults.baseURL).toBe('https://api-staging.cypress.io/')
  })
})
