const $Log = require('../../../../src/cypress/log')

describe('src/cypress/log', () => {
  context('#snapshot', () => {
    beforeEach(() => {
      this.cy = {
        createSnapshot: cy.stub().returns({}),
      }

      this.state = cy.stub()
      this.config = cy.stub()
      this.config.withArgs('isInteractive').returns(true)
      this.config.withArgs('numTestsKeptInMemory').returns(50)
      this.log = $Log.create(Cypress, this.cy, this.state, this.config)
    })

    it('creates a snapshot and returns the log', () => {
      const div = Cypress.$('<div />')

      const log = this.log({ '$el': div })
      const result = log.snapshot()

      expect(this.cy.createSnapshot).to.be.calledWith(undefined, div)
      expect(result).to.equal(log)
    })

    it('is no-op if not interactive', () => {
      this.config.withArgs('isInteractive').returns(false)

      const log = this.log()
      const result = log.snapshot()

      expect(this.cy.createSnapshot).not.to.be.called
      expect(result).to.equal(log)
    })

    it('is no-op if numTestsKeptInMemory is 0', () => {
      this.config.withArgs('numTestsKeptInMemory').returns(0)

      const log = this.log()
      const result = log.snapshot()

      expect(this.cy.createSnapshot).not.to.be.called
      expect(result).to.equal(log)
    })
  })
})
