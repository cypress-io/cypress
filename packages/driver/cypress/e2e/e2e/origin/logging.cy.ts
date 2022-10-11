describe('cy.origin logging', () => {
  const { _ } = Cypress

  it('groups callback commands on a passing test', () => {
    const logs: any[] = []

    cy.on('log:added', (attrs) => {
      logs.push(attrs)
    })

    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()

    cy.origin('http://www.foobar.com:3500', () => {
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
      expect(newUrlLog.group).to.equal(undefined)
      expect(logLog.group).to.be.undefined // ensure the group has ended
    })
  })

  // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/21300
  it.skip('logs cy.origin as group when failing with validation failure', () => {
    const logs: any[] = []

    cy.on('log:added', (attrs) => {
      logs.push(attrs)
    })

    cy.on('fail', () => {
      const originLog = _.find(logs, { name: 'origin' })

      expect(originLog.groupStart).to.be.true
    })

    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()

    // @ts-ignore
    cy.origin(false, () => {})
  })

  // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/21300
  it.skip('logs cy.origin as group when failing with serialization failure', () => {
    const logs: any[] = []

    cy.on('log:added', (attrs) => {
      logs.push(attrs)
    })

    cy.on('fail', () => {
      const originLog = _.find(logs, { name: 'origin' })

      expect(originLog.groupStart).to.be.true
    })

    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()

    const options = { args: { div: Cypress.$('div') } }

    cy.origin('http://www.foobar.com:3500', options, () => {})
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
      expect(newUrlLog.group).to.equal(undefined)
      expect(failingGetLog.group).to.equal(originLog.id)

      done()
    })

    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()

    cy.origin('http://www.foobar.com:3500', () => {
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
      expect(newUrlLog.group).to.equal(undefined)

      done()
    })

    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()

    cy.origin('http://www.foobar.com:3500', () => {
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
