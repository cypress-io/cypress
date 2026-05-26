import { describe, expect, it } from '@jest/globals'
import type { Request } from 'express'
import type { CorsOptions } from 'cors'

import { corsOriginDelegate, isOriginAllowed } from '../../../graphql/corsOriginDelegate'

const OWN_PORT = 4444

function makeReq (overrides: { origin?: string, path?: string, localPort?: number } = {}): Request {
  return {
    headers: overrides.origin === undefined ? {} : { origin: overrides.origin },
    path: overrides.path ?? '/__launchpad/graphql',
    socket: { localPort: overrides.localPort ?? OWN_PORT },
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

  it('allows the server\'s own localhost origin on its listening port', () => {
    expect(evaluate(makeReq({ origin: `http://localhost:${OWN_PORT}` })).origin).toBe(true)
    expect(evaluate(makeReq({ origin: `http://127.0.0.1:${OWN_PORT}` })).origin).toBe(true)
    expect(evaluate(makeReq({ origin: `http://[::1]:${OWN_PORT}` })).origin).toBe(true)
  })

  it('denies localhost origins on a different port', () => {
    expect(evaluate(makeReq({ origin: 'http://localhost:9999' })).origin).toBe(false)
    expect(evaluate(makeReq({ origin: 'http://127.0.0.1:9999' })).origin).toBe(false)
  })

  it('denies localhost origins with no explicit port', () => {
    expect(evaluate(makeReq({ origin: 'http://localhost' })).origin).toBe(false)
  })

  it('denies non-localhost origins on the GraphQL endpoint', () => {
    expect(evaluate(makeReq({ origin: 'https://evil.example.com', path: '/__launchpad/graphql' })).origin).toBe(false)
    expect(evaluate(makeReq({ origin: 'https://cloud.cypress.io', path: '/__launchpad/graphql' })).origin).toBe(false)
  })

  it('denies malformed origins', () => {
    expect(evaluate(makeReq({ origin: 'not a url' })).origin).toBe(false)
  })

  it('allows Cypress Cloud origins on /cloud-notification', () => {
    expect(evaluate(makeReq({ origin: 'https://cloud.cypress.io', path: '/cloud-notification' })).origin).toBe(true)
    expect(evaluate(makeReq({ origin: 'https://cloud-staging.cypress.io', path: '/cloud-notification' })).origin).toBe(true)
    expect(evaluate(makeReq({ origin: 'http://localhost:3000', path: '/cloud-notification' })).origin).toBe(true)
  })

  it('denies dev cloud origin on paths other than /cloud-notification', () => {
    expect(evaluate(makeReq({ origin: 'http://localhost:3000', path: '/__launchpad/graphql' })).origin).toBe(false)
  })

  it('denies arbitrary origins on /cloud-notification', () => {
    expect(evaluate(makeReq({ origin: 'https://evil.example.com', path: '/cloud-notification' })).origin).toBe(false)
  })
})

describe('isOriginAllowed', () => {
  it('allows missing origin', () => {
    expect(isOriginAllowed(undefined, OWN_PORT)).toBe(true)
  })

  it('allows missing origin even when no expectedPort is known', () => {
    expect(isOriginAllowed(undefined, undefined)).toBe(true)
  })

  it('allows localhost origins matching expectedPort', () => {
    expect(isOriginAllowed('http://localhost:4444', 4444)).toBe(true)
    expect(isOriginAllowed('http://127.0.0.1:4444', 4444)).toBe(true)
    expect(isOriginAllowed('http://[::1]:4444', 4444)).toBe(true)
  })

  it('denies localhost origins on a different port', () => {
    expect(isOriginAllowed('http://localhost:9999', 4444)).toBe(false)
  })

  it('denies non-localhost origins regardless of port', () => {
    expect(isOriginAllowed('https://evil.example.com', 4444)).toBe(false)
    expect(isOriginAllowed('https://cloud.cypress.io', 4444)).toBe(false)
  })

  it('denies any defined origin when expectedPort is unknown', () => {
    expect(isOriginAllowed('http://localhost:4444', undefined)).toBe(false)
  })

  it('denies malformed origins', () => {
    expect(isOriginAllowed('not a url', 4444)).toBe(false)
  })
})
