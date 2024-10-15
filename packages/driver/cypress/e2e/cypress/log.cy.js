const { create, Log, LogUtils } = require('@packages/driver/src/cypress/log')

const objectDiff = (newAttrs, oldAttrs) => {
  return Object.entries(newAttrs).reduce(
    (diff, [key, value]) => {
      const isEq = Cypress._.isEqualWith(oldAttrs[key], value, (objValue, othValue, key) => {
        if (objValue === undefined && othValue === undefined) return true

        if (key === 'updatedAtTimestamp') {
          return true
        }

        return undefined
      })

      return isEq ? diff : { ...diff, [key]: value }
    },
    {},
  )
}

describe('src/cypress/log', function () {
  context('#LogManager.createLog', () => {
    beforeEach(function () {
      this.cy = {
        createSnapshot: cy.stub().returns({}),
      }

      this.state = cy.stub()
      this.config = cy.stub()
      this.log = create(Cypress, this.cy, this.state, this.config)
    })

    it('throws when arguments are not an object', function (done) {
      cy.on('fail', (err) => {
        expect(err.message).to.include('`Cypress.log()` can only be called with an options object. Your argument was: `hi`')
        expect(err.docsUrl).to.equal('https://on.cypress.io/cypress-log')

        done()
      })

      this.log('hi')
    })

    it('creates a log', function () {
      const log = this.log({})

      expect(log).to.be.ok
    })

    it('does not create a log when protocol is disabled', function () {
      this.config.returns(false)
      const log = this.log({ name: 'mock', hidden: false })
      const hiddenLog = this.log({ name: 'mock', hidden: true })

      expect(log).to.be.ok
      expect(hiddenLog).to.be.undefined
    })

    it('creates a hidden log when protocol is enabled', function () {
      this.config.returns(true)
      const log = this.log({ name: 'mock', hidden: false })
      const hiddenLog = this.log({ name: 'mock', hidden: true })

      expect(log).to.be.ok
      expect(hiddenLog).to.be.ok
    })
  })

  context('#Log.set', () => {
    beforeEach(function () {
      this.createSnapshot = cy.stub().returns({})

      this.state = cy.stub()
      this.config = cy.stub()
      this.fireChangeEvent = cy.stub()
    })

    it('can set with key-value pair', function () {
      const log = new Log(this.createSnapshot, this.state, this.config, this.fireChangeEvent)

      log.set('key', 'value')

      expect(log.attributes).have.property('key', 'value')
    })

    it('can set with object', function () {
      const log = new Log(this.createSnapshot, this.state, this.config, this.fireChangeEvent)

      log.set({ key: 'value' })

      expect(log.attributes).have.property('key', 'value')
    })

    it('stringifies url value', function () {
      const log = new Log(this.createSnapshot, this.state, this.config, this.fireChangeEvent)

      log.set({ url: null })

      expect(log.attributes).have.property('url', '')

      log.set({ url: 'www.cypress.io' })

      expect(log.attributes).have.property('url', 'www.cypress.io')
    })

    it('maintains backwards compatibility with onConsole', function () {
      const log = new Log(this.createSnapshot, this.state, this.config, this.fireChangeEvent)
      const consoleProps = { Info: 'some info' }

      log.set({ onConsole: consoleProps })
      expect(log.attributes).have.property('consoleProps', consoleProps)
      expect(log.attributes).not.have.property('onConsole')
    })

    it('determines aliasType when alias is set', function () {
      const log = new Log(this.createSnapshot, this.state, this.config, this.fireChangeEvent)

      log.set({ alias: 'button' })
      expect(log.attributes).have.property('alias', 'button')
      expect(log.attributes).have.property('aliasType', 'primitive')

      log.set({ alias: 'button', $el: 'button' })
      expect(log.attributes).have.property('alias', 'button')
      expect(log.attributes).have.property('aliasType', 'dom')
    })

    it('does not allow overriding the log id', function () {
      const log = new Log(this.createSnapshot, this.state, this.config, this.fireChangeEvent)

      log.set({ id: 'log-1' })
      log.set({ id: 'diff-id' })
      expect(log.attributes).have.property('id', 'log-1')
    })

    it('adds updatedAtTimestamp each time the log is updated', function () {
      const log = new Log(this.createSnapshot, this.state, this.config, this.fireChangeEvent)

      log.set({ key: 'value' })

      expect(log.attributes).have.property('updatedAtTimestamp')
    })

    it('wraps consoleProps when consoleProps is set and is a function', function () {
      const log = new Log(this.createSnapshot, this.state, this.config, this.fireChangeEvent)

      const consoleProps = () => {
        return {
          Info: 'some info',
        }
      }

      log.set({ consoleProps })
      expect(log.attributes).have.property('consoleProps')
      expect(log.attributes.consoleProps).to.be.a('function')
      const wrappedProps = log.attributes.consoleProps()

      expect(wrappedProps).have.property('name')
      expect(wrappedProps).have.property('type', 'command')
      expect(wrappedProps).have.property('props')
      expect(wrappedProps.props).have.property('Info', 'some info')
    })

    it('sets element attributes when $el is set', function () {
      const log = new Log(this.createSnapshot, this.state, this.config, this.fireChangeEvent)

      log.setElAttrs = cy.stub()
      log.set({ $el: 'button' })
      expect(log.setElAttrs).to.have.been.called
    })

    it('only triggers change event if the log has already triggered the add event', function () {
      const log = new Log(this.createSnapshot, this.state, this.config, this.fireChangeEvent)

      log.set({ key: 'value' })
      log.fireChangeEvent.flush()
      expect(this.fireChangeEvent).to.not.have.been.called

      log._hasInitiallyLogged = true
      log.set({ key: 'diff val' })
      log.fireChangeEvent.flush()
      expect(this.fireChangeEvent).to.have.been.called
    })

    describe('when protocol is disabled', function () {
      it('does not truncate message value', function () {
        this.config.withArgs('protocolEnabled').returns(false)
        const log = new Log(this.createSnapshot, this.state, this.config, this.fireChangeEvent)
        const longMessage = 'x'.repeat(5000)

        log.set({ message: longMessage })
        expect(log.attributes).have.property('message')
        expect(log.attributes.message).have.have.length(5000)
      })

      it('does not truncates renderProps.message value', function () {
        this.config.withArgs('protocolEnabled').returns(false)
        const log = new Log(this.createSnapshot, this.state, this.config, this.fireChangeEvent)

        const longMessage = 'x'.repeat(5000)
        const renderProps = () => {
          return {
            message: longMessage,
          }
        }

        log.set({ renderProps })
        expect(log.attributes).have.property('renderProps')
        const renderedProps = log.attributes.renderProps()

        expect(renderedProps).have.property('message')
        expect(renderedProps.message).have.have.length(5000)
      })
    })

    describe('when protocol is enabled', function () {
      it('does not truncate message value', function () {
        this.config.withArgs('protocolEnabled').returns(false)
        const log = new Log(this.createSnapshot, this.state, this.config, this.fireChangeEvent)
        const longMessage = 'x'.repeat(5000)

        log.set({ message: longMessage })
        expect(log.attributes).have.property('message')
        expect(log.attributes.message).have.have.length(5000)
      })

      it('truncates message value of hidden log', function () {
        this.config.withArgs('protocolEnabled').returns(true)
        const log = new Log(this.createSnapshot, this.state, this.config, this.fireChangeEvent)
        const longMessage = 'x'.repeat(5000)

        log.set({ hidden: true, message: longMessage })
        expect(log.attributes).have.property('message')
        expect(log.attributes.message).have.have.length(3000)
      })

      it('does not truncates renderProps.message value', function () {
        this.config.withArgs('protocolEnabled').returns(false)
        const log = new Log(this.createSnapshot, this.state, this.config, this.fireChangeEvent)

        const longMessage = 'x'.repeat(5000)
        const renderProps = () => {
          return {
            message: longMessage,
          }
        }

        log.set({ renderProps })
        expect(log.attributes).have.property('renderProps')
        const renderedProps = log.attributes.renderProps()

        expect(renderedProps).have.property('message')
        expect(renderedProps.message).have.have.length(5000)
      })

      it('truncates renderProps.message value of hidden log', function () {
        this.config.withArgs('protocolEnabled').returns(true)
        const log = new Log(this.createSnapshot, this.state, this.config, this.fireChangeEvent)

        const longMessage = 'x'.repeat(5000)
        const renderProps = () => {
          return {
            message: longMessage,
          }
        }

        log.set({ hidden: true, renderProps })
        expect(log.attributes).have.property('renderProps')
        const renderedProps = log.attributes.renderProps()

        expect(renderedProps).have.property('message')
        expect(renderedProps.message).have.have.length(3000)
      })
    })
  })

  context('#triggerLog', function () {
    beforeEach(function () {
      this.cy = {
        createSnapshot: cy.stub().returns({}),
      }

      this.state = cy.stub()
      this.config = cy.stub()
      this.log = create(Cypress, this.cy, this.state, this.config)
    })

    it('emits when log is created that auto-ends, only triggers one event', function () {
      let addedEventCallCount = 0
      let changedEventCallCount = 0

      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'mock') {
          addedEventCallCount++
        }
      })

      cy.on('log:changed', (attrs, log) => {
        if (attrs.name === 'mock') {
          changedEventCallCount++
        }
      })

      let log

      cy.log('verify log:added event is triggered -- log({ name: mock })')
      .then(() => {
        log = this.log({ name: 'mock' })

        expect(log._hasInitiallyLogged).to.be.true
      })
      .wait(60, { log: false }) // allow for log debounce
      .then(() => {
        expect(addedEventCallCount, 'log:added call count').to.eq(1)
        expect(changedEventCallCount, 'log:changed call count').to.eq(0)
      })
    })

    it('emits when log is changed', function () {
      let addedEventCallCount = 0
      let changedEventCallCount = 0
      let originalAttrs
      let changedAttrs

      cy.on('log:added', (attrs, log) => {
        if (attrs.name === 'mock') {
          addedEventCallCount++
          originalAttrs = attrs
        }
      })

      cy.on('log:changed', (attrs, log) => {
        if (attrs.name === 'mock') {
          changedEventCallCount++
          changedAttrs = attrs
        }
      })

      let log

      cy.log('verify log:added event is triggered -- log({ name: mock })')
      .then(() => {
        log = this.log({ name: 'mock' })
      }).then(() => {
        expect(addedEventCallCount, 'log:added call count').to.eq(1)
        expect(changedEventCallCount, 'log:changed call count').to.eq(0)
      })
      .log('verify log:changed event is triggered -- log.set({ callCount: 1 })')
      .then(() => {
        log.set({ callCount: 1 })
      })
      .wait(60, { log: false }) // allow for log debounce
      .then(() => {
        expect(addedEventCallCount, 'log:added call count').to.eq(1)
        expect(changedEventCallCount, 'log:changed call count').to.eq(1)
        const updatedAttrs = objectDiff(changedAttrs, originalAttrs)

        expect(updatedAttrs).to.have.property('callCount', 1)
        expect(updatedAttrs).to.have.property('updatedAtTimestamp')
      })
      .log('verify log:changed event is not triggered -- log.set({ callCount: 1 })')
      .then(() => {
        changedAttrs = null
        log.set({ callCount: 1 })
      })
      .wait(60, { log: false }) // allow for log debounce
      .then(() => {
        expect(changedEventCallCount, 'log:changed call count').to.eq(1)
        expect(changedAttrs).to.be.null
      })
    })
  })

  context('#snapshot', function () {
    beforeEach(function () {
      this.cy = {
        createSnapshot: cy.stub().returns({}),
      }

      this.state = cy.stub()
      this.config = cy.stub()
      this.config.withArgs('isInteractive').returns(true)
      this.config.withArgs('numTestsKeptInMemory').returns(50)
      this.log = create(Cypress, this.cy, this.state, this.config)
    })

    it('creates a snapshot and returns the log', function () {
      const div = Cypress.$('<div />')

      const log = this.log({ '$el': div })
      const result = log.snapshot()

      expect(this.cy.createSnapshot).to.be.calledWith(undefined, div, undefined, log)
      expect(result).to.equal(log)
    })

    // https://github.com/cypress-io/cypress/issues/15816
    it('does not add snapshot if createSnapshot returns null', function () {
      this.cy.createSnapshot.returns(null)

      const log = this.log()
      const result = log.snapshot()

      expect(result.get('snapshots')).to.have.length(0)
    })

    it('is no-op if not interactive and protocol is disabled', function () {
      this.config.withArgs('isInteractive').returns(false)
      this.config.withArgs('protocolEnabled').returns(false)

      const log = this.log()
      const result = log.snapshot()

      expect(this.cy.createSnapshot).not.to.be.called
      expect(result).to.equal(log)
    })

    it('is no-op if numTestsKeptInMemory is 0 and protocol is disabled', function () {
      this.config.withArgs('numTestsKeptInMemory').returns(0)
      this.config.withArgs('protocolEnabled').returns(false)

      const log = this.log()
      const result = log.snapshot()

      expect(this.cy.createSnapshot).not.to.be.called
      expect(result).to.equal(log)
    })

    it('creates a snapshot and returns the log when not interactive and protocol is enabled', function () {
      this.config.withArgs('isInteractive').returns(false)
      this.config.withArgs('protocolEnabled').returns(true)
      this.config.withArgs('numTestsKeptInMemory').returns(0)

      const div = Cypress.$('<div />')

      const log = this.log({ '$el': div })
      const result = log.snapshot()

      expect(this.cy.createSnapshot).to.be.calledWith(undefined, div, undefined, log)
      expect(result).to.equal(log)
    })

    it('create a snapshot and returns the log when not interactive and protocol is enabled but numTestsKeptInMemory > 0', function () {
      this.config.withArgs('isInteractive').returns(false)
      this.config.withArgs('protocolEnabled').returns(true)
      this.config.withArgs('numTestsKeptInMemory').returns(50)

      const div = Cypress.$('<div />')

      const log = this.log({ '$el': div })
      const result = log.snapshot()

      expect(this.cy.createSnapshot).to.be.calledWith(undefined, div, undefined, log)
      expect(result).to.equal(log)
    })

    it('line break persists in snapshot', function () {
      const log = this.log({ 'message': 'First line \n Second Line' })
      const result = log.snapshot()

      expect(result).to.equal(log)
    })
  })

  context('protocolEnabled log change flush timing', function () {
    let dependency
    let resolveDep
    let changeEventsFlushed
    let resolveChangeEventsFlushed
    let timesFlushed = 0

    before(function () {
      this.cy = {
        createSnapshot: cy.stub().returns({}),
      }

      this.state = cy.stub()
      this.config = cy.stub()
      this.config.withArgs('protocolEnabled').returns(true)
      this.log = create(Cypress, this.cy, this.state, this.config)

      dependency = new Promise((resolve, _) => {
        resolveDep = resolve
      })

      changeEventsFlushed = new Promise((resolve, _) => {
        resolveChangeEventsFlushed = resolve
      })
    })

    it('predicate for flush assertions', function () {
      const log = this.log({ 'message': 'some message' })

      // spies / stubs get cleared between tests, so
      // a wholesale fn replacement is called for
      log.fireChangeEvent.flush = function () {
        timesFlushed++
        resolveChangeEventsFlushed(true)
      }

      resolveDep(log)
    })

    it('flushes change events on test:after:run', function () {
      cy.wrap(dependency).then(() => {
        cy.wrap(changeEventsFlushed).then((flushed) => {
          expect(flushed).to.be.true
          expect(timesFlushed).to.eq(1)
        })
      })
    })

    it('does not flush again on test:after:run', function () {
      // flush should not have been called again
      // since the test:after:run listener should've been removed
      expect(timesFlushed).to.eq(1)
    })
  })

  context('timestamps', () => {
    beforeEach(() => {
      this.cy = {
        createSnapshot: cy.stub().returns({}),
      }

      this.state = cy.stub()
      this.config = cy.stub()
      this.config.withArgs('isInteractive').returns(true)
      this.config.withArgs('numTestsKeptInMemory').returns(50)
      this.log = create(Cypress, this.cy, this.state, this.config)
    })

    it('sets created at and updated at timestamps', () => {
      const log = this.log()

      expect(log.attributes.createdAtTimestamp).to.be.a('number')
      expect(log.attributes.updatedAtTimestamp).to.be.a('number')
      expect(log.attributes.createdAtTimestamp).be.lessThan(log.attributes.updatedAtTimestamp)
    })
  })

  context('countLogsByTests', () => {
    it('returns zero if tests is empty', () => {
      const tests = {}

      expect(LogUtils.countLogsByTests(tests)).to.equal(0)
    })

    it('finds the highest id amongst the different types', () => {
      const tests = {
        a: {
          agents: [{
            id: 'log-idp.com-1',
          }],
          routes: [{
            id: 'log-idp.com-2',
          }],
          commands: [{
            id: 'log-idp.com-3',
          }],
          prevAttempts: [{
            agents: [{
              id: 'log-idp.com-4',
            }],
            routes: [{
              id: 'log-idp.com-5',
            }],
            commands: [{
              id: 'log-idp.com-6',
            }],
          }],
        },
      }

      expect(LogUtils.countLogsByTests(tests)).to.equal(6)
    })

    it('returns zero if there are no agents, routes, or commands', () => {
      const tests = {
        a: {
          notAThing: true,
        },
      }

      expect(LogUtils.countLogsByTests(tests)).to.equal(0)
    })
  })
})
