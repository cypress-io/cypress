describe('cy.origin logging', { browser: '!webkit' }, () => {
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

  it('logs cy.origin as group when failing with validation failure', () => {
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

  it('logs cy.origin as group when failing with serialization failure', () => {
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

  context('#consoleProps', () => {
    const getOriginLog = (logs: any[]) => _.findLast(logs, (log) => log.get('name') === 'origin')

    beforeEach(() => {
      cy.visit('/fixtures/primary-origin.html')
      cy.get('a[data-cy="cross-origin-secondary-link"]').click()
    })

    it('includes the origin/domain and yielded subject', () => {
      const logs: any[] = []

      cy.on('log:changed', (_attrs, log) => {
        logs.push(log)
      })

      cy.origin('http://www.foobar.com:3500', () => {
        cy.wrap('foobar')
      })

      cy.then(() => {
        const consoleProps = getOriginLog(logs).invoke('consoleProps')

        expect(consoleProps.name).to.equal('origin')
        expect(consoleProps.props['Origin / Domain']).to.equal('http://www.foobar.com:3500')
        expect(consoleProps.props.Yielded).to.equal('foobar')
      })
    })

    it('includes the args passed to the callback', () => {
      const logs: any[] = []

      cy.on('log:changed', (_attrs, log) => {
        logs.push(log)
      })

      cy.origin('http://www.foobar.com:3500', { args: { foo: 'bar' } }, () => {})

      cy.then(() => {
        const consoleProps = getOriginLog(logs).invoke('consoleProps')

        expect(consoleProps.props.Args).to.deep.equal({ foo: 'bar' })
      })
    })

    // https://github.com/cypress-io/cypress/issues/27385
    // When the callback yields an unserializable subject (e.g. the secondary
    // origin's `window` from `cy.visit`), cy.origin yields an unserializable
    // subject proxy that throws when accessed. Printing the consoleProps to the
    // console (which clones them) must not throw.
    it('does not throw when the yielded subject is unserializable', () => {
      const logs: any[] = []

      cy.on('log:changed', (_attrs, log) => {
        logs.push(log)
      })

      cy.origin('http://www.foobar.com:3500', () => {
        // visiting yields the AUT `window`, which cannot be serialized back
        // across origins
        cy.visit('/fixtures/dom.html')
      })

      cy.then(() => {
        let consoleProps

        expect(() => {
          consoleProps = getOriginLog(logs).invoke('consoleProps')
        }).not.to.throw()

        // the reporter deep clones the consoleProps before printing them to the
        // console - this is what threw against the unserializable subject proxy
        expect(() => _.cloneDeep(consoleProps)).not.to.throw()

        expect(consoleProps.props.Yielded).to.contain('unserializable subject')
      })
    })
  })
})
