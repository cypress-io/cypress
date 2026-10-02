import { describe, it, expect } from 'vitest'
import { planBridgeListeners, formatHostResolverRules } from '../../../lib/mtls/bridge-plan'
import type { ClientCertificateEntry } from '../../../lib/mtls/bridge-plan'

const material = (seed: string) => {
  return {
    cert: [Buffer.from(`cert-${seed}`)],
    key: [{ pem: Buffer.from(`key-${seed}`) }],
  }
}

const entry = (url: string, hostname: string, port: number | undefined, seed: string): ClientCertificateEntry => {
  return { url, hostname, port, material: material(seed) }
}

describe('planBridgeListeners', () => {
  it('opens one listener per origin', () => {
    const listeners = planBridgeListeners([
      entry('https://a.com:443', 'a.com', 443, 'a'),
      entry('https://b.com:8443', 'b.com', 8443, 'b'),
    ])

    expect(listeners).toHaveLength(2)
    expect(listeners.map((l) => `${l.hostname}:${l.port}`)).toEqual(['a.com:443', 'b.com:8443'])
  })

  it('collapses entries that differ only by path onto one listener', () => {
    const listeners = planBridgeListeners([
      entry('https://a.com/one', 'a.com', 443, 'same'),
      entry('https://a.com/two', 'a.com', 443, 'same'),
    ])

    expect(listeners).toHaveLength(1)
    expect(listeners[0].sourceUrls).toEqual(['https://a.com/one', 'https://a.com/two'])
  })

  it('throws when one origin is configured with different certificates', () => {
    const plan = () => {
      return planBridgeListeners([
        entry('https://a.com/one', 'a.com', 443, 'first'),
        entry('https://a.com/two', 'a.com', 443, 'second'),
      ])
    }

    expect(plan).toThrow(expect.objectContaining({ type: 'CLIENT_CERTIFICATES_CONFLICT' }))
  })

  it('treats the same host on different ports as separate origins', () => {
    const listeners = planBridgeListeners([
      entry('https://a.com:443', 'a.com', 443, 'first'),
      entry('https://a.com:8443', 'a.com', 8443, 'second'),
    ])

    expect(listeners).toHaveLength(2)
  })

  it('defaults a portless entry to 443', () => {
    const listeners = planBridgeListeners([entry('https://a.com', 'a.com', undefined, 'a')])

    expect(listeners[0].port).toEqual(443)
  })

  it('keeps wildcard hostnames intact', () => {
    const listeners = planBridgeListeners([entry('https://*.a.com', '*.a.com', undefined, 'a')])

    expect(listeners[0].hostname).toEqual('*.a.com')
  })
})

describe('formatHostResolverRules', () => {
  it('maps each origin, port included, at its own local listener', () => {
    const rules = formatHostResolverRules([
      { hostname: 'a.com', port: 443, listenPort: 9001 },
      { hostname: '*.b.com', port: 8443, listenPort: 9002 },
    ])

    expect(rules).toEqual('MAP a.com:443 127.0.0.1:9001,MAP *.b.com:8443 127.0.0.1:9002')
  })

  it('is empty when nothing is configured', () => {
    expect(formatHostResolverRules([])).toEqual('')
  })
})
