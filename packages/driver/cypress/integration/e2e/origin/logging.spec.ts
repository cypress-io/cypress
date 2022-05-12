describe('cy.origin logging', () => {
  const { _ } = Cypress

  it('groups callback commands on a passing test', () => {
    const logs: any[] = []

    cy.on('log:added', (attrs) => {
      logs.push(attrs)
    })

    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()

    cy.origin('http://foobar.com:3500', () => {
      cy.get('[data-cy="dom-check"]').invoke('text')
    })

    cy.log('after').should(() => {
      const originLog = _.find(logs, { name: 'origin' })
      const getLog = _.find(logs, { name: 'get', message: '[data-cy="dom-check"]' })
      const invokeLog = _.find(logs, { name: 'invoke', message: '.text()' })
      const newUrlLog = _.find(logs, { name: 'new url' })
      const logLog = _.find(logs, { name: 'log' })

      expect(originLog.groupStart).to.be.true
      expect(getLog.group).to.equal(originLog.id)
      expect(invokeLog.group).to.equal(originLog.id)
      expect(newUrlLog.group).to.equal(originLog.id)
      expect(logLog.group).to.be.undefined // ensure the group has ended
    })
  })

  it('logs cy.origin as group when failing with validation failure', (done) => {
    const logs: any[] = []

    cy.on('log:added', (attrs) => {
      logs.push(attrs)
    })

    cy.on('fail', () => {
      const originLog = _.find(logs, { name: 'origin' })

      expect(originLog.groupStart).to.be.true

      // FIXME: Tests that end with a cy.origin command and enqueue no further cy
      // commands may have origin's unload event bleed into subsequent tests
      // and prevent stability from being reached, causing those tests to hang.
      // We execute done after a brief timeout to ensure stability
      // is reached for the next test. This timeout can be removed with the
      // completion of: https://github.com/cypress-io/cypress/issues/21300
      setTimeout(done, 0)
    })

    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()

    // @ts-ignore
    cy.origin(false, () => {})
  })

  it('logs cy.origin as group when failing with serialization failure', (done) => {
    const logs: any[] = []

    cy.on('log:added', (attrs) => {
      logs.push(attrs)
    })

    cy.on('fail', () => {
      const originLog = _.find(logs, { name: 'origin' })

      expect(originLog.groupStart).to.be.true

      // FIXME: Tests that end with a cy.origin command and enqueue no further cy
      // commands may have origin's unload event bleed into subsequent tests
      // and prevent stability from being reached, causing those tests to hang.
      // We execute done after a brief timeout to ensure stability
      // is reached for the next test. This timeout can be removed with the
      // completion of: https://github.com/cypress-io/cypress/issues/21300
      setTimeout(done, 0)
    })

    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()

    const options = { args: { div: Cypress.$('div') } }

    cy.origin('http://foobar.com:3500', options, () => {})
  })

  it('groups callback commands when failing with inner command failure', (done) => {
    const logs: any[] = []

    cy.on('log:added', (attrs) => {
      logs.push(attrs)
    })

    cy.on('fail', () => {
      const originLog = _.find(logs, { name: 'origin' })
      const getLog = _.find(logs, { name: 'get', message: '[data-cy="dom-check"]' })
      const invokeLog = _.find(logs, { name: 'invoke', message: '.text()' })
      const newUrlLog = _.find(logs, { name: 'new url' })
      const failingGetLog = _.find(logs, { name: 'get', message: '#does-not-exist' })

      expect(originLog.groupStart).to.be.true
      expect(getLog.group).to.equal(originLog.id)
      expect(invokeLog.group).to.equal(originLog.id)
      expect(newUrlLog.group).to.equal(originLog.id)
      expect(failingGetLog.group).to.equal(originLog.id)

      done()
    })

    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()

    cy.origin('http://foobar.com:3500', () => {
      cy.get('[data-cy="dom-check"]').invoke('text')
      cy.get('#does-not-exist', { timeout: 1 })
    })

    cy.log('after')
  })

  it('groups callback commands when failing with async failure', (done) => {
    const logs: any[] = []

    cy.on('log:added', (attrs) => {
      logs.push(attrs)
    })

    cy.on('fail', () => {
      const originLog = _.find(logs, { name: 'origin' })
      const getLog = _.find(logs, { name: 'get', message: '[data-cy="dom-check"]' })
      const invokeLog = _.find(logs, { name: 'invoke', message: '.text()' })
      const newUrlLog = _.find(logs, { name: 'new url' })

      expect(originLog.groupStart).to.be.true
      expect(getLog.group).to.equal(originLog.id)
      expect(invokeLog.group).to.equal(originLog.id)
      expect(newUrlLog.group).to.equal(originLog.id)

      done()
    })

    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()

    cy.origin('http://foobar.com:3500', () => {
      cy.get('[data-cy="dom-check"]').invoke('text').then(() => {
        setTimeout(() => {
          throw new Error('async error')
        })
      })

      cy.wait(300)
    })

    cy.log('after')
  })
})
