import { describe, it, expect } from 'vitest'
import { planBridgeListeners, formatHostResolverRules } from '../../../lib/mtls/bridge-plan'
import type { ClientCertificateEntry } from '../../../lib/mtls/bridge-plan'

const material = (seed: string) => {
  return {
    cert: [Buffer.from(`cert-${seed}`)],
    key: [{ pem: Buffer.from(`key-${seed}`) }],
  }
}

const entry = (url: string, hostname: string, port: number | undefined, seed: string, pathScoped = false): ClientCertificateEntry => {
  return { url, hostname, port, hostMatcher: { match: (h) => h === hostname }, pathScoped, material: material(seed) }
}

describe('planBridgeListeners', () => {
  it('opens one listener per origin', () => {
    const listeners = planBridgeListeners([
      entry('https://a.com:443', 'a.com', 443, 'a'),
      entry('https://b.com:8443', 'b.com', 8443, 'b'),
    ])

    expect(listeners).toHaveLength(2)
    expect(listeners.map((l) => `${l.hostname}:${l.port}`)).toStrictEqual(['a.com:443', 'b.com:8443'])
  })

  it('collapses a path-scoped entry onto the origin-wide entry for the same certificate', () => {
    const listeners = planBridgeListeners([
      entry('https://a.com', 'a.com', undefined, 'same'),
      entry('https://a.com/two', 'a.com', 443, 'same', true),
    ])

    expect(listeners).toHaveLength(1)
    expect(listeners[0].sourceUrls).toStrictEqual(['https://a.com', 'https://a.com/two'])
  })

  // The resolver rule steers the whole origin, so bridging a path-scoped entry would present
  // its certificate for every path a page could request.
  it('throws when an origin is only configured for some of its paths', () => {
    const plan = () => {
      return planBridgeListeners([
        entry('https://a.com/one', 'a.com', 443, 'same', true),
        entry('https://a.com/two', 'a.com', 443, 'same', true),
      ])
    }

    expect(plan).toThrow(expect.objectContaining({ type: 'CLIENT_CERTIFICATES_PATH_SCOPED' }))
  })

  it('throws when one origin is configured with different certificates', () => {
    const plan = () => {
      return planBridgeListeners([
        entry('https://a.com/one', 'a.com', 443, 'first', true),
        entry('https://a.com/two', 'a.com', 443, 'second', true),
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

    expect(listeners[0].port).toStrictEqual(443)
  })

  it('keeps wildcard hostnames intact', () => {
    const listeners = planBridgeListeners([entry('https://*.a.com', '*.a.com', undefined, 'a')])

    expect(listeners[0].hostname).toStrictEqual('*.a.com')
  })
})

describe('formatHostResolverRules', () => {
  // Chromium applies the first matching rule, and a wildcard matches a more specific host,
  // so a catch-all listed first would steer that host to the wrong listener and present the
  // wrong certificate. Nothing else catches this: the two are different origins, so the
  // conflict check never fires.
  it('orders a more specific origin ahead of a wildcard that would match it', () => {
    const rules = formatHostResolverRules([
      { hostname: '*.example.com', port: 443, listenPort: 9001 },
      { hostname: 'special.example.com', port: 443, listenPort: 9002 },
    ]).split(',')

    expect(rules[0]).toContain('special.example.com:443')
    expect(rules[1]).toContain('*.example.com:443')
  })

  it('keeps wildcards ordered most specific first', () => {
    const rules = formatHostResolverRules([
      { hostname: '*', port: 443, listenPort: 9001 },
      { hostname: '*.example.com', port: 443, listenPort: 9002 },
      { hostname: 'special.example.com', port: 443, listenPort: 9003 },
    ]).split(',')

    expect(rules.map((rule) => rule.split(' ')[1])).toStrictEqual([
      'special.example.com:443',
      '*.example.com:443',
      '*:443',
    ])
  })

  it('maps each origin, port included, at its own local listener', () => {
    const rules = formatHostResolverRules([
      { hostname: 'a.com', port: 443, listenPort: 9001 },
      { hostname: '*.b.com', port: 8443, listenPort: 9002 },
    ])

    expect(rules).toStrictEqual('MAP a.com:443 127.0.0.1:9001,MAP *.b.com:8443 127.0.0.1:9002')
  })

  it('is empty when nothing is configured', () => {
    expect(formatHostResolverRules([])).toStrictEqual('')
  })
})
