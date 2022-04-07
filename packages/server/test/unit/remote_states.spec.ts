require('../spec_helper')

import { RemoteStates } from '../../lib/remote_states'
import EventEmitter from 'events'

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

    this.eventEmitter = new EventEmitter()
    this.remoteStates.addEventListeners(this.eventEmitter)
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
        },
      })
    })
  })

  context('#isInOriginStack', () => {
    it('returns true when the requested url is in the origin stack', function () {
      const isInOriginStack = this.remoteStates.isInOriginStack('http://localhost:3500')

      expect(isInOriginStack).to.be.true
    })

    it('returns false when the requested url is not in the origin stack', function () {
      const isInOriginStack = this.remoteStates.isInOriginStack('http://notfound.com')

      expect(isInOriginStack).to.be.false
    })
  })

  context('#isSecondaryOrigin', () => {
    it('returns true when the requested url is a secondary origin', function () {
      this.eventEmitter.emit('ready:for:origin', { originPolicy: 'https://google.com' })
      const isSecondaryOrigin = this.remoteStates.isSecondaryOrigin('https://staging.google.com')

      expect(isSecondaryOrigin).to.be.true
    })

    it('returns false when the requested url is the primary origin', function () {
      this.eventEmitter.emit('ready:for:origin', { originPolicy: 'https://google.com' })
      const isSecondaryOrigin = this.remoteStates.isSecondaryOrigin('http://localhost:3500')

      expect(isSecondaryOrigin).to.be.false
    })

    it('returns false when the requested url is not in the origin stack', function () {
      this.eventEmitter.emit('ready:for:origin', { originPolicy: 'https://google.com' })
      const isSecondaryOrigin = this.remoteStates.isSecondaryOrigin('https://foobar.com')

      expect(isSecondaryOrigin).to.be.false
    })
  })

  context('#isPrimaryOrigin', () => {
    it('returns true when the requested url is the primary origin', function () {
      const isPrimaryOrigin = this.remoteStates.isPrimaryOrigin('http://localhost:3500')

      expect(isPrimaryOrigin).to.be.true
    })

    it('returns false when the requested url is not the primary origin', function () {
      this.eventEmitter.emit('ready:for:origin', { originPolicy: 'https://google.com' })
      const isPrimaryOrigin = this.remoteStates.isPrimaryOrigin('http://google.com')

      expect(isPrimaryOrigin).to.be.false
    })
  })

  context('#removeCurrentOrigin', () => {
    it('removes the current origin from the stack', function () {
      this.eventEmitter.emit('ready:for:origin', { originPolicy: 'https://google.com' })
      expect(this.remoteStates.isInOriginStack('https://google.com')).to.be.true

      this.remoteStates.removeCurrentOrigin('https://google.com')

      expect(this.remoteStates.isInOriginStack('https://google.com')).to.be.false
    })

    it('throws an error when trying to remove the incorrect origin', function () {
      this.eventEmitter.emit('ready:for:origin', { originPolicy: 'https://google.com' })
      expect(this.remoteStates.isInOriginStack('https://google.com')).to.be.true

      expect(() => this.remoteStates.removeCurrentOrigin('http://notfound.com'))
      .to.throw(Error, 'Tried to remove origin http://notfound.com but https://google.com was found. This should never happen and likely is a bug. Please open an issue.')
    })
  })

  context('#reset', () => {
    it('resets the origin stack and remote states to the primary', function () {
      this.eventEmitter.emit('ready:for:origin', { originPolicy: 'https://google.com' })

      expect(this.remoteStates.isInOriginStack('https://google.com')).to.be.true

      this.remoteStates.reset()

      expect(this.remoteStates.get('https://google.com')).to.be.undefined
      expect(this.remoteStates.isInOriginStack('https://google.com')).to.be.false
    })
  })

  context('#current', () => {
    it('returns the remote state for the current origin in the stack', function () {
      this.eventEmitter.emit('ready:for:origin', { originPolicy: 'https://google.com' })
      this.remoteStates.set('https://staging.google.com/foo/bar', { isCrossOrigin: true })

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
        },
      })
    })
  })

  context('#set', () => {
    it('sets primary state and origin when isCrossOrigin is false', function () {
      expect(this.remoteStates.isPrimaryOrigin('http://localhost:3500')).to.be.true

      const state = this.remoteStates.set('https://staging.google.com/foo/bar', { isCrossOrigin: false })

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
        },
      })

      expect(this.remoteStates.isPrimaryOrigin('https://staging.google.com')).to.be.true
    })

    it('sets a secondary state when isCrossOrigin is true', function () {
      expect(this.remoteStates.isPrimaryOrigin('http://localhost:3500')).to.be.true

      const state = this.remoteStates.set('https://staging.google.com/foo/bar', { isCrossOrigin: true })

      this.remoteStates.addOrigin('https://staging.google.com')

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
        },
      })

      expect(this.remoteStates.isPrimaryOrigin('http://localhost:3500')).to.be.true
      expect(this.remoteStates.isPrimaryOrigin('https://staging.google.com')).to.be.false
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
        },
      }

      this.remoteStates.set(state)

      const actualState = this.remoteStates.get('http://www.foobar.com')

      expect(actualState).to.deep.equal(state)
    })
  })

  context('events', () => {
    it('can add a secondary remote state on ready:for:origin', function () {
      let currentState = this.remoteStates.current()

      expect(currentState.origin).to.equal('http://localhost:3500')

      this.eventEmitter.emit('ready:for:origin', { originPolicy: 'http://cypress.io' })

      currentState = this.remoteStates.current()
      expect(currentState.origin).to.equal('http://cypress.io')
      expect(this.remoteStates.isSecondaryOrigin(currentState.origin)).to.be.true
    })

    it('doesn\'t do anything if ready:for:origin failed', function () {
      let currentState = this.remoteStates.current()

      expect(currentState.origin).to.equal('http://localhost:3500')

      this.eventEmitter.emit('ready:for:origin', { failed: true })

      currentState = this.remoteStates.current()
      expect(currentState.origin).to.equal('http://localhost:3500')
      expect(this.remoteStates.isSecondaryOrigin(currentState.origin)).to.be.false
    })

    it('removes the current origin when cross:origin:finished is received', function () {
      let currentState = this.remoteStates.current()

      expect(currentState.origin).to.equal('http://localhost:3500')

      this.eventEmitter.emit('ready:for:origin', { originPolicy: 'http://cypress.io' })

      currentState = this.remoteStates.current()
      expect(currentState.origin).to.equal('http://cypress.io')

      this.eventEmitter.emit('cross:origin:finished', 'http://cypress.io')

      currentState = this.remoteStates.current()
      expect(currentState.origin).to.equal('http://localhost:3500')
    })

    it('doesn\'t override an existing secondary remote state on ready:for:origin', function () {
      let currentState = this.remoteStates.current()

      expect(currentState.origin).to.equal('http://localhost:3500')

      // simulate a cy.origin by calling ready:for:origin followed by setting
      // the origin with specific auth options and finally calling cross:origin:finished
      this.eventEmitter.emit('ready:for:origin', { originPolicy: 'http://cypress.io' })
      this.remoteStates.set('http://cypress.io', { auth: { username: 'u', password: 'p' }, isCrossOrigin: true })
      currentState = this.remoteStates.current()
      expect(currentState.origin).to.equal('http://cypress.io')
      expect(currentState.auth).to.deep.equal({ username: 'u', password: 'p' })
      this.eventEmitter.emit('cross:origin:finished', 'http://cypress.io')

      // verify calling ready:for:origin doesn't reset the previous state
      this.eventEmitter.emit('ready:for:origin', { originPolicy: 'http://cypress.io' })

      currentState = this.remoteStates.current()
      expect(currentState.origin).to.equal('http://cypress.io')
      expect(currentState.auth).to.deep.equal({ username: 'u', password: 'p' })
    })
  })
})
