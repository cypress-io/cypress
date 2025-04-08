context('.currentRetry', () => {
  describe('test is not retried', () => {
    before(() => {
      expect(Cypress.currentRetry).to.eq(0)
    })

    beforeEach(() => {
      expect(Cypress.currentRetry).to.eq(0)
    })

    afterEach(() => {
      expect(Cypress.currentRetry).to.eq(0)
    })

    after(() => {
      expect(Cypress.currentRetry).to.eq(0)
    })

    it('correctly returns currentRetry', () => {
      expect(Cypress.currentRetry).to.eq(0)
    })
  })

  describe('test is retried due to beforeEach hook failure', { retries: 1 }, () => {
    before(() => {
      expect(Cypress.currentRetry).to.be.oneOf([0, 1])
    })

    beforeEach(() => {
      expect(Cypress.currentRetry).to.eq(1)
    })

    it('correctly returns currentRetry', () => {
      expect(Cypress.currentRetry).to.eq(1)
    })

    afterEach(() => {
      expect(Cypress.currentRetry).to.eq(1)
    })

    after(() => {
      expect(Cypress.currentRetry).to.eq(1)
    })
  })

  describe('test is retried due to test failure', { retries: 1 }, () => {
    before(() => {
      expect(Cypress.currentRetry).to.be.oneOf([0, 1])
    })

    beforeEach(() => {
      expect(Cypress.currentRetry).to.be.oneOf([0, 1])
    })

    it('correctly returns currentRetry', () => {
      expect(Cypress.currentRetry).to.eq(1)
    })

    afterEach(() => {
      expect(Cypress.currentRetry).to.eq(1)
    })

    after(() => {
      expect(Cypress.currentRetry).to.eq(1)
    })
  })

  describe('test is retried due to afterEach hook failure', { retries: 1 }, () => {
    before(() => {
      expect(Cypress.currentRetry).to.be.oneOf([0, 1])
    })

    beforeEach(() => {
      expect(Cypress.currentRetry).to.be.oneOf([0, 1])
    })

    it('correctly returns currentRetry', () => {
      expect(Cypress.currentRetry).to.be.oneOf([0, 1])
    })

    afterEach(() => {
      expect(Cypress.currentRetry).to.eq(1)
    })

    after(() => {
      expect(Cypress.currentRetry).to.eq(1)
    })
  })
})
