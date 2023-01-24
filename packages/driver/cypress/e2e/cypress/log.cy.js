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

    it('is no-op if not interactive', function () {
      this.config.withArgs('isInteractive').returns(false)

      const log = this.log()
      const result = log.snapshot()

      expect(this.cy.createSnapshot).not.to.be.called
      expect(result).to.equal(log)
    })

    it('is no-op if numTestsKeptInMemory is 0', function () {
      this.config.withArgs('numTestsKeptInMemory').returns(0)

      const log = this.log()
      const result = log.snapshot()

      expect(this.cy.createSnapshot).not.to.be.called
      expect(result).to.equal(log)
    })

    it('line break persists in snapshot', function () {
      const log = this.log({ 'message': 'First line \n Second Line' })
      const result = log.snapshot()

      expect(result).to.equal(log)
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
