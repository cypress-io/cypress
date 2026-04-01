import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { DocumentDomainInjection } from '@packages/network-tools'

import { RemoteStates, DEFAULT_DOMAIN_NAME, type RemoteState } from '../../lib/remote_states'

describe('remote states', () => {
  const serverPorts = {
    server: 3030,
    fileServer: 3030,
  }

  const remoteStatesServerPorts = () => {
    return serverPorts
  }

  let remoteStates: RemoteStates
  let documentDomainInjection: { getOrigin: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    documentDomainInjection = {
      getOrigin: vi.fn((url: string) => {
        return new URL(url).origin
      }),
    }

    remoteStates = new RemoteStates(
      remoteStatesServerPorts,
      documentDomainInjection as unknown as DocumentDomainInjection,
    )

    remoteStates.set('http://localhost:3500')
  })

  describe('#get', () => {
    it('returns the remote state for an origin when a matching origin key is returned from DocumentDomainInjection', () => {
      documentDomainInjection.getOrigin.mockReturnValue('http://localhost:3500')
      const state = remoteStates.get('http://localhost:3500/foobar')

      expect(state).toEqual({
        auth: undefined,
        origin: 'http://localhost:3500',
        strategy: 'http',
        domainName: 'localhost',
        fileServer: null,
        props: {
          port: '3500',
          domain: '',
          tld: 'localhost',
          subdomain: null,
          protocol: 'http:',
        },
      })
    })

    it('returns undefined when the remote state is not found', () => {
      const state = remoteStates.get('http://notfound.com')

      expect(state).toBeUndefined()
    })

    it('changing returned state does not mutate remote state', () => {
      const originalState = remoteStates.get('http://localhost:3500/foobar')

      expect(originalState).toEqual({
        auth: undefined,
        origin: 'http://localhost:3500',
        strategy: 'http',
        domainName: 'localhost',
        fileServer: null,
        props: {
          port: '3500',
          domain: '',
          tld: 'localhost',
          subdomain: null,
          protocol: 'http:',
        },
      })

      originalState!.auth = { username: 'u', password: 'p' }

      const currentState = remoteStates.get('http://localhost:3500/foobar')

      expect(currentState).toEqual({
        auth: undefined,
        origin: 'http://localhost:3500',
        strategy: 'http',
        domainName: 'localhost',
        fileServer: null,
        props: {
          port: '3500',
          domain: '',
          tld: 'localhost',
          subdomain: null,
          protocol: 'http:',
        },
      })
    })
  })

  describe('#getPrimary', () => {
    it('returns the primary when there is only the primary in remote states', () => {
      const state = remoteStates.getPrimary()

      expect(state).toEqual({
        auth: undefined,
        origin: 'http://localhost:3500',
        strategy: 'http',
        domainName: 'localhost',
        fileServer: null,
        props: {
          port: '3500',
          domain: '',
          tld: 'localhost',
          subdomain: null,
          protocol: 'http:',
        },
      })
    })

    it('returns the primary when there are multiple remote states', () => {
      remoteStates.set('https://staging.google.com/foo/bar', {}, false)

      const state = remoteStates.getPrimary()

      expect(state).toEqual({
        auth: undefined,
        origin: 'http://localhost:3500',
        strategy: 'http',
        domainName: 'localhost',
        fileServer: null,
        props: {
          port: '3500',
          domain: '',
          tld: 'localhost',
          subdomain: null,
          protocol: 'http:',
        },
      })
    })
  })

  describe('#isPrimarySuperDomainOrigin', () => {
    it('returns true when the requested url is the primary origin', () => {
      const isPrimarySuperDomainOrigin = remoteStates.isPrimarySuperDomainOrigin('http://localhost:3500')

      expect(isPrimarySuperDomainOrigin).toBe(true)
    })

    it('returns false when the requested url is not the primary origin', () => {
      remoteStates.set('https://google.com', {}, false)
      const isPrimarySuperDomainOrigin = remoteStates.isPrimarySuperDomainOrigin('http://google.com')

      expect(isPrimarySuperDomainOrigin).toBe(false)
    })
  })

  describe('#reset', () => {
    it('resets the origin stack and remote states to the primary', () => {
      remoteStates.set('https://google.com', {}, false)

      expect(remoteStates.get('https://google.com')).toBeDefined()

      remoteStates.reset()

      expect(remoteStates.get('https://google.com')).toBeUndefined()
    })
  })

  describe('#current', () => {
    it('returns the remote state for the current origin in the stack', () => {
      remoteStates.set('https://google.com', {})
      remoteStates.set('https://staging.google.com/foo/bar', {}, false)

      const state = remoteStates.current()

      expect(state).toEqual({
        auth: undefined,
        origin: 'https://staging.google.com',
        strategy: 'http',
        domainName: 'google.com',
        fileServer: null,
        props: {
          port: '443',
          domain: 'google',
          tld: 'com',
          subdomain: 'staging',
          protocol: 'https:',
        },
      })
    })
  })

  describe('#set', () => {
    it('sets primary state and origin when isPrimarySuperDomainOrigin is true', () => {
      expect(remoteStates.isPrimarySuperDomainOrigin('http://localhost:3500')).toBe(true)

      const state = remoteStates.set('https://staging.google.com/foo/bar', {}, true)

      expect(state).toEqual({
        auth: undefined,
        origin: 'https://staging.google.com',
        strategy: 'http',
        domainName: 'google.com',
        fileServer: null,
        props: {
          port: '443',
          domain: 'google',
          tld: 'com',
          subdomain: 'staging',
          protocol: 'https:',
        },
      })

      expect(remoteStates.get('https://staging.google.com')).toEqual(state)

      expect(remoteStates.isPrimarySuperDomainOrigin('https://staging.google.com')).toBe(true)
    })

    it('sets a secondary state when isPrimarySuperDomainOrigin is false', () => {
      expect(remoteStates.isPrimarySuperDomainOrigin('http://localhost:3500')).toBe(true)

      const state = remoteStates.set('https://staging.google.com/foo/bar', {}, false)

      expect(state).toEqual({
        auth: undefined,
        origin: 'https://staging.google.com',
        strategy: 'http',
        domainName: 'google.com',
        fileServer: null,
        props: {
          port: '443',
          domain: 'google',
          tld: 'com',
          subdomain: 'staging',
          protocol: 'https:',
        },
      })

      expect(remoteStates.get('https://staging.google.com')).toEqual(state)

      expect(remoteStates.isPrimarySuperDomainOrigin('http://localhost:3500')).toBe(true)
      expect(remoteStates.isPrimarySuperDomainOrigin('https://staging.google.com')).toBe(false)
    })

    it('sets port to 443 when omitted and https:', () => {
      const state = remoteStates.set('https://staging.google.com/foo/bar')

      expect(state).toEqual({
        auth: undefined,
        origin: 'https://staging.google.com',
        strategy: 'http',
        domainName: 'google.com',
        fileServer: null,
        props: {
          port: '443',
          domain: 'google',
          tld: 'com',
          subdomain: 'staging',
          protocol: 'https:',
        },
      })
    })

    it('sets port to 80 when omitted and http:', () => {
      const state = remoteStates.set('http://staging.google.com/foo/bar')

      expect(state).toEqual({
        auth: undefined,
        origin: 'http://staging.google.com',
        strategy: 'http',
        domainName: 'google.com',
        fileServer: null,
        props: {
          port: '80',
          domain: 'google',
          tld: 'com',
          subdomain: 'staging',
          protocol: 'http:',
        },
      })
    })

    it('sets host + port to localhost', () => {
      const state = remoteStates.set('http://localhost:4200/a/b?q=1#asdf')

      expect(state).toEqual({
        auth: undefined,
        origin: 'http://localhost:4200',
        strategy: 'http',
        domainName: 'localhost',
        fileServer: null,
        props: {
          port: '4200',
          domain: '',
          tld: 'localhost',
          subdomain: null,
          protocol: 'http:',
        },
      })
    })

    it('sets local file', () => {
      const state = remoteStates.set('/index.html')

      expect(state).toEqual({
        auth: undefined,
        origin: `http://${DEFAULT_DOMAIN_NAME}:${serverPorts.server}`,
        strategy: 'file',
        domainName: DEFAULT_DOMAIN_NAME,
        fileServer: `http://${DEFAULT_DOMAIN_NAME}:${serverPorts.fileServer}`,
        props: null,
      })
    })

    it('sets <root>', () => {
      const state = remoteStates.set('<root>')

      expect(state).toEqual({
        auth: undefined,
        origin: `http://${DEFAULT_DOMAIN_NAME}:${serverPorts.server}`,
        strategy: 'file',
        domainName: DEFAULT_DOMAIN_NAME,
        fileServer: `http://${DEFAULT_DOMAIN_NAME}:${serverPorts.fileServer}`,
        props: null,
      })
    })

    it('sets the remote state when passed a state object', () => {
      const state: RemoteState = {
        auth: undefined,
        origin: 'http://www.foobar.com',
        strategy: 'http',
        domainName: 'foobar.com',
        fileServer: null,
        props: {
          port: '80',
          domain: 'foobar',
          tld: 'com',
          subdomain: 'www',
          protocol: 'http:',
        },
      }

      remoteStates.set(state)

      const actualState = remoteStates.get('http://www.foobar.com')

      expect(actualState).toEqual(state)
    })
  })
})
