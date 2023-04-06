require('../spec_helper')

import { RemoteStates } from '../../lib/remote_states'

describe('remote states', () => {
  beforeEach(function () {
    this.remoteStates = new RemoteStates(() => {
      return {
        serverPort: 9999,
        fileServerPort: 9998,
      }
    })

    // set the initial state
    this.remoteStates.set('http://localhost:3500')
  })

  context('#get', () => {
    it('returns the remote state by for requested origin policy', function () {
      const state = this.remoteStates.get('http://localhost:3500/foobar')

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
      const state = this.remoteStates.get('http://notfound.com')

      expect(state).to.be.undefined
    })

    it('changing returned state does not mutate remote state', function () {
      const originalState = this.remoteStates.get('http://localhost:3500/foobar')

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

      const currentState = this.remoteStates.get('http://localhost:3500/foobar')

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

  context('#getPrimary', () => {
    it('returns the primary when there is only the primary in remote states', function () {
      const state = this.remoteStates.getPrimary()

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
      this.remoteStates.set('https://staging.google.com/foo/bar', {}, false)

      const state = this.remoteStates.getPrimary()

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

  context('#isPrimarySuperDomainOrigin', () => {
    it('returns true when the requested url is the primary origin', function () {
      const isPrimarySuperDomainOrigin = this.remoteStates.isPrimarySuperDomainOrigin('http://localhost:3500')

      expect(isPrimarySuperDomainOrigin).to.be.true
    })

    it('returns false when the requested url is not the primary origin', function () {
      this.remoteStates.set('https://google.com', {}, false)
      const isPrimarySuperDomainOrigin = this.remoteStates.isPrimarySuperDomainOrigin('http://google.com')

      expect(isPrimarySuperDomainOrigin).to.be.false
    })
  })

  context('#reset', () => {
    it('resets the origin stack and remote states to the primary', function () {
      this.remoteStates.set('https://google.com', {}, false)

      expect(this.remoteStates.get('https://google.com')).to.not.be.undefined

      this.remoteStates.reset()

      expect(this.remoteStates.get('https://google.com')).to.be.undefined
    })
  })

  context('#current', () => {
    it('returns the remote state for the current origin in the stack', function () {
      this.remoteStates.set('https://google.com', {})
      this.remoteStates.set('https://staging.google.com/foo/bar', {}, false)

      const state = this.remoteStates.current()

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

  context('#set', () => {
    it('sets primary state and origin when isPrimarySuperDomainOrigin is true', function () {
      expect(this.remoteStates.isPrimarySuperDomainOrigin('http://localhost:3500')).to.be.true

      const state = this.remoteStates.set('https://staging.google.com/foo/bar', {}, true)

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

      expect(this.remoteStates.get('https://staging.google.com')).to.deep.equal(state)

      expect(this.remoteStates.isPrimarySuperDomainOrigin('https://staging.google.com')).to.be.true
    })

    it('sets a secondary state when isPrimarySuperDomainOrigin is false', function () {
      expect(this.remoteStates.isPrimarySuperDomainOrigin('http://localhost:3500')).to.be.true

      const state = this.remoteStates.set('https://staging.google.com/foo/bar', {}, false)

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

      expect(this.remoteStates.get('https://staging.google.com')).to.deep.equal(state)

      expect(this.remoteStates.isPrimarySuperDomainOrigin('http://localhost:3500')).to.be.true
      expect(this.remoteStates.isPrimarySuperDomainOrigin('https://staging.google.com')).to.be.false
    })

    it('overrides the existing state', function () {
      this.remoteStates.set('https://staging.google.com/foo/bar')

      let state = this.remoteStates.get('https://google.com')

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

      this.remoteStates.set('https://prod.google.com/foo/bar')

      state = this.remoteStates.get('https://google.com')

      expect(state).to.deep.equal({
        auth: undefined,
        origin: 'https://prod.google.com',
        strategy: 'http',
        domainName: 'google.com',
        fileServer: null,
        props: {
          port: '443',
          domain: 'google',
          tld: 'com',
          subdomain: 'prod',
          protocol: 'https:',
        },
      })
    })

    it('sets port to 443 when omitted and https:', function () {
      const state = this.remoteStates.set('https://staging.google.com/foo/bar')

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
      const state = this.remoteStates.set('http://staging.google.com/foo/bar')

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
      const state = this.remoteStates.set('http://localhost:4200/a/b?q=1#asdf')

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
      const state = this.remoteStates.set('/index.html')

      expect(state).to.deep.equal({
        auth: undefined,
        origin: 'http://localhost:9999',
        strategy: 'file',
        domainName: 'localhost',
        fileServer: 'http://localhost:9998',
        props: null,
      })
    })

    it('sets <root>', function () {
      const state = this.remoteStates.set('<root>')

      expect(state).to.deep.equal({
        auth: undefined,
        origin: 'http://localhost:9999',
        strategy: 'file',
        domainName: 'localhost',
        fileServer: 'http://localhost:9998',
        props: null,
      })
    })

    it('sets the remote state when passed a state object', function () {
      const state = {
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

      this.remoteStates.set(state)

      const actualState = this.remoteStates.get('http://www.foobar.com')

      expect(actualState).to.deep.equal(state)
    })
  })
})
