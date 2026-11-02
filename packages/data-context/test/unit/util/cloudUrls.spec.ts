import { afterEach, describe, expect, it } from '@jest/globals'
import { resolveCloudEnv, resolveCloudUrl } from '../../../src/util/cloudUrls'

describe('resolveCloudUrl', () => {
  it.each([0, 1, 2, 3, 4, 5])('targets development workspace %s', (workspace) => {
    expect(resolveCloudUrl('development', { CYPRESS_INTERNAL_WORKSPACE_NUM: String(workspace) })).toBe(`http://localhost:${workspace * 10000 + 3000}`)
  })

  it('keeps the default development URL without a workspace', () => {
    expect(resolveCloudUrl('development', {})).toBe('http://localhost:3000')
  })

  it('applies the cloud environment override before workspace selection', () => {
    const env = {
      CYPRESS_INTERNAL_ENV: 'production',
      CYPRESS_INTERNAL_CLOUD_ENV: 'development',
      CYPRESS_INTERNAL_WORKSPACE_NUM: '4',
    }

    expect(resolveCloudUrl(resolveCloudEnv(env), env)).toBe('http://localhost:43000')
  })

  it('ignores the workspace when the cloud environment override selects staging', () => {
    const env = {
      CYPRESS_INTERNAL_ENV: 'development',
      CYPRESS_INTERNAL_CLOUD_ENV: 'staging',
      CYPRESS_INTERNAL_WORKSPACE_NUM: 'invalid',
    }

    expect(resolveCloudUrl(resolveCloudEnv(env), env)).toBe('https://cloud-staging.cypress.io')
  })

  it('does not apply the workspace to production', () => {
    expect(resolveCloudUrl('production', { CYPRESS_INTERNAL_WORKSPACE_NUM: '4' })).toBe('https://cloud.cypress.io')
  })
})

describe('resolveCloudEnv', () => {
  it('returns CYPRESS_INTERNAL_CLOUD_ENV when it is set', () => {
    expect(resolveCloudEnv({ CYPRESS_INTERNAL_CLOUD_ENV: 'production' })).toEqual('production')
  })

  it('prefers CYPRESS_INTERNAL_CLOUD_ENV over CYPRESS_INTERNAL_ENV', () => {
    expect(resolveCloudEnv({
      CYPRESS_INTERNAL_CLOUD_ENV: 'staging',
      CYPRESS_INTERNAL_ENV: 'production',
    })).toEqual('staging')
  })

  it('falls back to CYPRESS_INTERNAL_ENV when CYPRESS_INTERNAL_CLOUD_ENV is unset', () => {
    expect(resolveCloudEnv({ CYPRESS_INTERNAL_ENV: 'staging' })).toEqual('staging')
  })

  it('falls back to development when neither env var is set', () => {
    expect(resolveCloudEnv({})).toEqual('development')
  })

  it('falls back to development when CYPRESS_INTERNAL_ENV is an empty string', () => {
    expect(resolveCloudEnv({ CYPRESS_INTERNAL_ENV: '' })).toEqual('development')
  })

  it('treats an empty CYPRESS_INTERNAL_CLOUD_ENV as an explicit value', () => {
    expect(resolveCloudEnv({ CYPRESS_INTERNAL_CLOUD_ENV: '', CYPRESS_INTERNAL_ENV: 'production' })).toEqual('')
  })

  describe('default process.env', () => {
    const original = {
      CYPRESS_INTERNAL_CLOUD_ENV: process.env.CYPRESS_INTERNAL_CLOUD_ENV,
      CYPRESS_INTERNAL_ENV: process.env.CYPRESS_INTERNAL_ENV,
    }

    afterEach(() => {
      for (const key of Object.keys(original) as (keyof typeof original)[]) {
        if (original[key] === undefined) {
          delete process.env[key]
        } else {
          process.env[key] = original[key]
        }
      }
    })

    it('reads from process.env when no argument is provided', () => {
      delete process.env.CYPRESS_INTERNAL_ENV
      process.env.CYPRESS_INTERNAL_CLOUD_ENV = 'staging'

      expect(resolveCloudEnv()).toEqual('staging')
    })

    it('defaults to development when process.env has neither var', () => {
      delete process.env.CYPRESS_INTERNAL_CLOUD_ENV
      delete process.env.CYPRESS_INTERNAL_ENV

      expect(resolveCloudEnv()).toEqual('development')
    })
  })
})
