import { describe, it, expect, beforeEach, MockedObject, vi } from 'vitest'
import { OriginBehavior } from '../lib/document-domain-injection'

import { RemoteStates, DEFAULT_DOMAIN_NAME } from '../lib/remote-states'
import type { RemoteState } from '../lib/remote-states'

describe('remote states', () => {
  const serverPorts = {
    server: 3030,
    fileServer: 3030,
  }

  const remoteStatesServerPorts = () => {
    return serverPorts
  }

  let remoteStates: RemoteStates
  let documentDomainInjection: MockedObject<OriginBehavior>

  beforeEach(() => {
    documentDomainInjection = {

      // While the behavior of this class is partially determined by DocumentDomainInjection,
      // it's not necessary to test multiple permutations of its getOriginKey - as long as it's
      // returning an appropriate origin key, this class will behave as expected.
      getOrigin: vi.fn().mockImplementation((url) => {
        return new URL(url).origin
      }),
      getHostname: vi.fn().mockImplementation((url) => {
        return new URL(url).hostname
      }),
      urlsMatch: vi.fn().mockImplementation((frameUrl, topUrl) => {
        return new URL(frameUrl).origin === new URL(topUrl).origin
      }),
      shouldInjectDocumentDomain: vi.fn().mockImplementation((url) => {
        return true
      }),
    }

    remoteStates = new RemoteStates(remoteStatesServerPorts, documentDomainInjection)
    // set the initial state
    remoteStates.set('http://localhost:3500')
  })

  describe('#get', () => {
    it('returns the remote state for an origin when a matching origin key is returned from DocumentDomainInjection', function () {
      documentDomainInjection.getOrigin.mockReturnValue('http://localhost:3500')
      const state = remoteStates.get('http://localhost:3500/foobar')

      expect(state).to.deep.equal({
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

    it('returns undefined when the remote state is not found', function () {
      const state = remoteStates.get('http://notfound.com')

      expect(state).to.be.undefined
    })

    it('changing returned state does not mutate remote state', function () {
      const originalState = remoteStates.get('http://localhost:3500/foobar')

      expect(originalState).to.deep.equal({
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

      originalState.auth = { username: 'u', password: 'p' }

      const currentState = remoteStates.get('http://localhost:3500/foobar')

      expect(currentState).to.deep.equal({
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
    it('returns the primary when there is only the primary in remote states', function () {
      const state = remoteStates.getPrimary()

      expect(state).to.deep.equal({
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

    it('returns the primary when there are multiple remote states', function () {
      remoteStates.set('https://staging.google.com/foo/bar', {}, false)

      const state = remoteStates.getPrimary()

      expect(state).to.deep.equal({
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
    it('returns true when the requested url is the primary origin', function () {
      const isPrimarySuperDomainOrigin = remoteStates.isPrimarySuperDomainOrigin('http://localhost:3500')

      expect(isPrimarySuperDomainOrigin).to.be.true
    })

    it('returns false when the requested url is not the primary origin', function () {
      remoteStates.set('https://google.com', {}, false)
      const isPrimarySuperDomainOrigin = remoteStates.isPrimarySuperDomainOrigin('http://google.com')

      expect(isPrimarySuperDomainOrigin).to.be.false
    })
  })

  describe('#reset', () => {
    it('resets the origin stack and remote states to the primary', function () {
      remoteStates.set('https://google.com', {}, false)

      expect(remoteStates.get('https://google.com')).to.not.be.undefined

      remoteStates.reset()

      expect(remoteStates.get('https://google.com')).to.be.undefined
    })
  })

  describe('#current', () => {
    it('returns the remote state for the current origin in the stack', function () {
      remoteStates.set('https://google.com', {})
      remoteStates.set('https://staging.google.com/foo/bar', {}, false)

      const state = remoteStates.current()

      expect(state).to.deep.equal({
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
    it('sets primary state and origin when isPrimarySuperDomainOrigin is true', function () {
      expect(remoteStates.isPrimarySuperDomainOrigin('http://localhost:3500')).to.be.true

      const state = remoteStates.set('https://staging.google.com/foo/bar', {}, true)

      expect(state).to.deep.equal({
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

      expect(remoteStates.get('https://staging.google.com')).to.deep.equal(state)

      expect(remoteStates.isPrimarySuperDomainOrigin('https://staging.google.com')).to.be.true
    })

    it('sets a secondary state when isPrimarySuperDomainOrigin is false', function () {
      expect(remoteStates.isPrimarySuperDomainOrigin('http://localhost:3500')).to.be.true

      const state = remoteStates.set('https://staging.google.com/foo/bar', {}, false)

      expect(state).to.deep.equal({
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

      expect(remoteStates.get('https://staging.google.com')).to.deep.equal(state)

      expect(remoteStates.isPrimarySuperDomainOrigin('http://localhost:3500')).to.be.true
      expect(remoteStates.isPrimarySuperDomainOrigin('https://staging.google.com')).to.be.false
    })

    it('sets port to 443 when omitted and https:', function () {
      const state = remoteStates.set('https://staging.google.com/foo/bar')

      expect(state).to.deep.equal({
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

    it('sets port to 80 when omitted and http:', function () {
      const state = remoteStates.set('http://staging.google.com/foo/bar')

      expect(state).to.deep.equal({
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

    it('sets host + port to localhost', function () {
      const state = remoteStates.set('http://localhost:4200/a/b?q=1#asdf')

      expect(state).to.deep.equal({
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

    it('sets local file', function () {
      const state = remoteStates.set('/index.html')

      expect(state).to.deep.equal({
        auth: undefined,
        origin: `http://${DEFAULT_DOMAIN_NAME}:${serverPorts.server}`,
        strategy: 'file',
        domainName: DEFAULT_DOMAIN_NAME,
        fileServer: `http://${DEFAULT_DOMAIN_NAME}:${serverPorts.fileServer}`,
        props: null,
      })
    })

    it('sets <root>', function () {
      const state = remoteStates.set('<root>')

      expect(state).to.deep.equal({
        auth: undefined,
        origin: `http://${DEFAULT_DOMAIN_NAME}:${serverPorts.server}`,
        strategy: 'file',
        domainName: DEFAULT_DOMAIN_NAME,
        fileServer: `http://${DEFAULT_DOMAIN_NAME}:${serverPorts.fileServer}`,
        props: null,
      })
    })

    it('sets the remote state when passed a state object', function () {
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

      expect(actualState).to.deep.equal(state)
    })
  })
})
