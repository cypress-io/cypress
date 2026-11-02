import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createCloudRequest } from '../../../../lib/cloud/api/cloud_request'

describe('CloudRequest development workspace', () => {
  beforeEach(() => {
    vi.stubEnv('CYPRESS_INTERNAL_ENV', 'development')
    vi.stubEnv('CYPRESS_CONFIG_ENV', undefined)
    vi.stubEnv('CYPRESS_INTERNAL_WORKSPACE_NUM', '4')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('uses the workspace API for the default base URL', () => {
    expect(createCloudRequest().defaults.baseURL).toBe('http://localhost:41234/')
  })

  it.each(['http://localhost:9999/custom', 'https://custom.example.com'])('preserves the explicit base URL %s', (baseURL) => {
    expect(createCloudRequest({ baseURL }).defaults.baseURL).toBe(baseURL)
  })

  it('does not validate the workspace when a base URL is explicitly provided', () => {
    vi.stubEnv('CYPRESS_INTERNAL_WORKSPACE_NUM', 'invalid')

    expect(createCloudRequest({ baseURL: 'http://localhost:9999' }).defaults.baseURL).toBe('http://localhost:9999')
  })

  it('honors the config environment override', () => {
    vi.stubEnv('CYPRESS_CONFIG_ENV', 'staging')

    expect(createCloudRequest().defaults.baseURL).toBe('https://api-staging.cypress.io/')
  })
})
