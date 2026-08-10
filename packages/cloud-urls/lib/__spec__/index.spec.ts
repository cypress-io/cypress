import { afterEach, describe, expect, it } from 'vitest'
import { eventCollectorEnv, eventCollectorUrl, resolveCloudEnv } from '../index'

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
})

describe('eventCollectorEnv', () => {
  it('returns CYPRESS_INTERNAL_EVENT_COLLECTOR_ENV when it names a cloud environment', () => {
    expect(eventCollectorEnv({ CYPRESS_INTERNAL_EVENT_COLLECTOR_ENV: 'staging' })).toEqual('staging')
  })

  it('falls back to production when CYPRESS_INTERNAL_EVENT_COLLECTOR_ENV is unset', () => {
    expect(eventCollectorEnv({})).toEqual('production')
  })

  it('falls back to production when CYPRESS_INTERNAL_EVENT_COLLECTOR_ENV is not a cloud environment', () => {
    expect(eventCollectorEnv({ CYPRESS_INTERNAL_EVENT_COLLECTOR_ENV: 'test' })).toEqual('production')
  })

  it('ignores values that only exist on the url map prototype', () => {
    expect(eventCollectorEnv({ CYPRESS_INTERNAL_EVENT_COLLECTOR_ENV: 'toString' })).toEqual('production')
  })
})

describe('eventCollectorUrl', () => {
  it('targets the anonymous collector by default', () => {
    expect(eventCollectorUrl(false, {})).toEqual('https://cloud.cypress.io/anon-collect')
  })

  it('targets the machine collector when the event includes a machine id', () => {
    expect(eventCollectorUrl(true, {})).toEqual('https://cloud.cypress.io/machine-collect')
  })

  it('resolves the collector environment from the provided env', () => {
    expect(eventCollectorUrl(false, { CYPRESS_INTERNAL_EVENT_COLLECTOR_ENV: 'development' })).toEqual('http://localhost:3000/anon-collect')
  })
})

describe('default process.env', () => {
  const KEYS = ['CYPRESS_INTERNAL_CLOUD_ENV', 'CYPRESS_INTERNAL_ENV', 'CYPRESS_INTERNAL_EVENT_COLLECTOR_ENV'] as const
  const original = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]))

  afterEach(() => {
    for (const key of KEYS) {
      if (original[key] === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = original[key]
      }
    }
  })

  it('resolveCloudEnv reads from process.env when no argument is provided', () => {
    delete process.env.CYPRESS_INTERNAL_ENV
    process.env.CYPRESS_INTERNAL_CLOUD_ENV = 'staging'

    expect(resolveCloudEnv()).toEqual('staging')
  })

  it('resolveCloudEnv defaults to development when process.env has neither var', () => {
    delete process.env.CYPRESS_INTERNAL_CLOUD_ENV
    delete process.env.CYPRESS_INTERNAL_ENV

    expect(resolveCloudEnv()).toEqual('development')
  })

  it('eventCollectorEnv reads from process.env when no argument is provided', () => {
    process.env.CYPRESS_INTERNAL_EVENT_COLLECTOR_ENV = 'staging'

    expect(eventCollectorEnv()).toEqual('staging')
  })

  it('eventCollectorUrl reads from process.env when no env is provided', () => {
    process.env.CYPRESS_INTERNAL_EVENT_COLLECTOR_ENV = 'staging'

    expect(eventCollectorUrl()).toEqual('https://cloud-staging.cypress.io/anon-collect')
  })
})
