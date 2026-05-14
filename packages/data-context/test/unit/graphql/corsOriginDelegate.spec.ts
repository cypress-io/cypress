import { describe, expect, it } from '@jest/globals'
import type { Request } from 'express'
import type { CorsOptions } from 'cors'

import { corsOriginDelegate, isOriginAllowed } from '../../../graphql/corsOriginDelegate'

function makeReq (overrides: { origin?: string, path?: string } = {}): Request {
  return {
    headers: overrides.origin === undefined ? {} : { origin: overrides.origin },
    path: overrides.path ?? '/__launchpad/graphql',
  } as unknown as Request
}

function evaluate (req: Request): CorsOptions {
  let result: CorsOptions | undefined

  corsOriginDelegate(req, (err, options) => {
    if (err) {
      throw err
    }

    result = options
  })

  if (!result) {
    throw new Error('CORS delegate did not produce options')
  }

  return result
}

describe('corsOriginDelegate', () => {
  it('allows requests with no Origin header', () => {
    expect(evaluate(makeReq()).origin).toBe(true)
  })

  it('allows http://localhost origins on any port', () => {
    expect(evaluate(makeReq({ origin: 'http://localhost' })).origin).toBe(true)
    expect(evaluate(makeReq({ origin: 'http://localhost:8080' })).origin).toBe(true)
    expect(evaluate(makeReq({ origin: 'https://localhost:1234' })).origin).toBe(true)
  })

  it('allows 127.0.0.0/8 IPv4 loopback origins', () => {
    expect(evaluate(makeReq({ origin: 'http://127.0.0.1:5678' })).origin).toBe(true)
    expect(evaluate(makeReq({ origin: 'http://127.0.0.9' })).origin).toBe(true)
    expect(evaluate(makeReq({ origin: 'http://127.255.255.255' })).origin).toBe(true)
  })

  it('allows IPv6 loopback origin [::1]', () => {
    expect(evaluate(makeReq({ origin: 'http://[::1]:5678' })).origin).toBe(true)
  })

  it('allows .localhost subdomains', () => {
    expect(evaluate(makeReq({ origin: 'http://app.localhost:5678' })).origin).toBe(true)
  })

  it('denies non-localhost origins on the GraphQL endpoint', () => {
    expect(evaluate(makeReq({ origin: 'https://evil.example.com', path: '/__launchpad/graphql' })).origin).toBe(false)
    expect(evaluate(makeReq({ origin: 'https://cloud.cypress.io', path: '/__launchpad/graphql' })).origin).toBe(false)
  })

  it('denies non-loopback IPv4 origins', () => {
    expect(evaluate(makeReq({ origin: 'http://128.0.0.1' })).origin).toBe(false)
    expect(evaluate(makeReq({ origin: 'http://10.0.0.1' })).origin).toBe(false)
  })

  it('denies malformed origins', () => {
    expect(evaluate(makeReq({ origin: 'not a url' })).origin).toBe(false)
  })

  it('allows Cypress Cloud origins on /cloud-notification', () => {
    expect(evaluate(makeReq({ origin: 'https://cloud.cypress.io', path: '/cloud-notification' })).origin).toBe(true)
    expect(evaluate(makeReq({ origin: 'https://cloud-staging.cypress.io', path: '/cloud-notification' })).origin).toBe(true)
  })

  it('denies arbitrary origins on /cloud-notification', () => {
    expect(evaluate(makeReq({ origin: 'https://evil.example.com', path: '/cloud-notification' })).origin).toBe(false)
  })
})

describe('isOriginAllowed', () => {
  it('allows missing origin', () => {
    expect(isOriginAllowed(undefined)).toBe(true)
  })

  it('allows localhost variants', () => {
    expect(isOriginAllowed('http://localhost:5678')).toBe(true)
    expect(isOriginAllowed('http://127.0.0.1')).toBe(true)
    expect(isOriginAllowed('http://[::1]')).toBe(true)
    expect(isOriginAllowed('http://app.localhost')).toBe(true)
  })

  it('denies non-localhost origins', () => {
    expect(isOriginAllowed('https://evil.example.com')).toBe(false)
    expect(isOriginAllowed('https://cloud.cypress.io')).toBe(false)
  })

  it('denies malformed origins', () => {
    expect(isOriginAllowed('not a url')).toBe(false)
  })
})
