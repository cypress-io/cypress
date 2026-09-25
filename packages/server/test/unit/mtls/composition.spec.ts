import { describe, it, expect, beforeEach } from 'vitest'
// through the package entry, matching the composition root — a deep import would load a
// second copy of the module with its own store
import { clientCertificates as certStore } from '@packages/network'
import { createMtlsBridge, toBridgeEntries } from '../../../lib/mtls'

function store (url: string, seed: string) {
  const entry = new certStore.UrlClientCertificates(url)

  entry.clientCertificates = new certStore.ClientCertificates()
  entry.clientCertificates.cert.push(Buffer.from(`cert-${seed}`))
  certStore.clientCertificateStoreSingleton.addClientCertificatesForUrl(entry)
}

describe('toBridgeEntries', () => {
  beforeEach(() => certStore.clientCertificateStoreSingleton.clear())

  it('recovers the material configured for an exact origin', () => {
    store('https://example.com:8443', 'exact')

    expect(toBridgeEntries([{ url: 'https://example.com:8443' }])).toMatchObject([{
      hostname: 'example.com',
      port: 8443,
    }])
  })

  // A wildcard entry has to match its own rule on the way back out, or the entry is dropped
  // and the certificate is accepted then silently never presented.
  it('keeps a wildcard entry', () => {
    store('https://*.example.com', 'wildcard')

    expect(toBridgeEntries([{ url: 'https://*.example.com' }])).toMatchObject([{
      hostname: '*.example.com',
      port: undefined,
    }])
  })

  it('keeps a path-scoped entry, carrying its host and port', () => {
    store('https://example.com/secure', 'path')

    expect(toBridgeEntries([{ url: 'https://example.com/secure' }])).toMatchObject([{
      hostname: 'example.com',
    }])
  })

  it('returns nothing when no certificates are configured', () => {
    expect(toBridgeEntries([])).toEqual([])
  })
})

describe('createMtlsBridge', () => {
  beforeEach(() => certStore.clientCertificateStoreSingleton.clear())

  // Two path-scoped URLs on one origin only collide once `toBridgeEntries` has resolved both
  // through the store, so the conflict is a property of the composition, not of either part.
  it('reports conflicting certificates for one origin as a Cypress error', async () => {
    store('https://example.com:8443/one', 'first')
    store('https://example.com:8443/two', 'second')

    const attempt = createMtlsBridge({
      clientCertificates: [
        { url: 'https://example.com:8443/one' },
        { url: 'https://example.com:8443/two' },
      ],
      caFolder: '/tmp/mtls-bridge-unused',
    })

    await expect(attempt).rejects.toMatchObject({ type: 'CLIENT_CERTIFICATES_CONFLICT' })
  })

  it('does nothing when no client certificate is configured', async () => {
    await expect(createMtlsBridge({ clientCertificates: [], caFolder: '/tmp/mtls-bridge-unused' })).resolves.toBeUndefined()
  })
})
