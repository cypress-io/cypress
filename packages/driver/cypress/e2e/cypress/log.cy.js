const { create, LogUtils } = require('@packages/driver/src/cypress/log')

describe('src/cypress/log', function () {
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

      expect(this.cy.createSnapshot).to.be.calledWith(undefined, div)
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

      expect(this.cy.createSnapshot).to.be.calledWith(undefined, div)
      expect(result).to.equal(log)
    })

    it('create a snapshot and returns the log when not interactive and protocol is enabled but numTestsKeptInMemory > 0', function () {
      this.config.withArgs('isInteractive').returns(false)
      this.config.withArgs('protocolEnabled').returns(true)
      this.config.withArgs('numTestsKeptInMemory').returns(50)

      const div = Cypress.$('<div />')

      const log = this.log({ '$el': div })
      const result = log.snapshot()

      expect(this.cy.createSnapshot).to.be.calledWith(undefined, div)
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

    before(function () {
      changeEventsFlushed = false
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
        resolveChangeEventsFlushed(true)
      }

      resolveDep(log)
    })

    it('flushes change events on test:after:run', function () {
      cy.wrap(dependency).then((prevLog) => {
        cy.wrap(changeEventsFlushed).then((flushed) => {
          expect(flushed).to.be.true
        })
      })
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
