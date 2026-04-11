describe('cy.origin logging', { browser: '!webkit' }, () => {
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
      const originLog = logs.find((l) => l.name === 'origin')
      const getLog = logs.find((l) => l.name === 'get' && l.message === '[data-cy="dom-check"]')
      const invokeLog = logs.find((l) => l.name === 'invoke' && l.message === '.text()')
      const newUrlLog = logs.find((l) => l.name === 'new url')
      const logLog = logs.find((l) => l.name === 'log')

      expect(originLog.groupStart).to.be.true
      expect(getLog.group).to.equal(originLog.id)
      expect(invokeLog.group).to.equal(originLog.id)
      expect(newUrlLog.group).to.equal(undefined)
      expect(logLog.group).to.be.undefined // ensure the group has ended
    })
  })

  it('logs cy.origin as group when failing with validation failure', () => {
    const logs: any[] = []

    cy.on('log:added', (attrs) => {
      logs.push(attrs)
    })

    cy.on('fail', () => {
      const originLog = logs.find((l) => l.name === 'origin')

      expect(originLog.groupStart).to.be.true
    })

    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()

    // @ts-ignore
    cy.origin(false, () => {})
  })

  it('logs cy.origin as group when failing with serialization failure', () => {
    const logs: any[] = []

    cy.on('log:added', (attrs) => {
      logs.push(attrs)
    })

    cy.on('fail', () => {
      const originLog = logs.find((l) => l.name === 'origin')

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
      const originLog = logs.find((l) => l.name === 'origin')
      const getLog = logs.find((l) => l.name === 'get' && l.message === '[data-cy="dom-check"]')
      const invokeLog = logs.find((l) => l.name === 'invoke' && l.message === '.text()')
      const newUrlLog = logs.find((l) => l.name === 'new url')
      const failingGetLog = logs.find((l) => l.name === 'get' && l.message === '#does-not-exist')

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
      const originLog = logs.find((l) => l.name === 'origin')
      const getLog = logs.find((l) => l.name === 'get' && l.message === '[data-cy="dom-check"]')
      const invokeLog = logs.find((l) => l.name === 'invoke' && l.message === '.text()')
      const newUrlLog = logs.find((l) => l.name === 'new url')

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
