import { afterEach, describe, expect, it } from '@jest/globals'
import { resolveCloudEnv } from '../../../src/util/cloudUrls'

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
