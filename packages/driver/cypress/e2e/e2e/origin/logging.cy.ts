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

    // capture the live log objects as they are added/changed so we can inspect
    // the parent `origin` command's consoleProps. The assertions below use a
    // retrying `.should()` since the final log:changed may not have flushed yet.
    const captureLogs = (logs: any[]) => {
      const capture = (_attrs, log) => logs.push(log)

      cy.on('log:added', capture)
      cy.on('log:changed', capture)
    }

    beforeEach(() => {
      cy.visit('/fixtures/primary-origin.html')
      cy.get('a[data-cy="cross-origin-secondary-link"]').click()
    })

    it('includes the command name/type, origin, args, and serializable yielded subject', () => {
      const logs: any[] = []

      captureLogs(logs)

      cy.origin('http://www.foobar.com:3500', { args: { foo: 'bar' } }, () => {
        cy.wrap('foobar')
      })

      cy.wrap({}).should(() => {
        const originLog = getOriginLog(logs)

        expect(originLog, 'origin log').to.exist

        const consoleProps = originLog.invoke('consoleProps')

        expect(consoleProps.name).to.equal('origin')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props['Origin / Domain']).to.equal('http://www.foobar.com:3500')
        expect(consoleProps.props.Args).to.deep.equal({ foo: 'bar' })
        expect(consoleProps.props.Yielded).to.equal('foobar')

        // the reporter deep clones consoleProps before printing - must not throw
        expect(() => _.cloneDeep(consoleProps)).not.to.throw()
      })
    })

    // https://github.com/cypress-io/cypress/issues/27385
    // When the callback yields an unserializable subject, cy.origin yields an
    // unserializable subject proxy that throws when accessed or cloned. Printing
    // the consoleProps to the console (which deep clones them) must not throw.
    it('does not throw when the yielded subject is unserializable', () => {
      const logs: any[] = []

      captureLogs(logs)

      cy.origin('http://www.foobar.com:3500', () => {
        // a Symbol cannot be structured-cloned back across origins, so cy.origin
        // yields an unserializable subject proxy
        return { key: Symbol('') }
      })

      cy.wrap({}).should(() => {
        const originLog = getOriginLog(logs)

        expect(originLog, 'origin log').to.exist

        let consoleProps

        expect(() => {
          consoleProps = originLog.invoke('consoleProps')
        }).not.to.throw()

        // the reporter deep clones the consoleProps before printing them to the
        // console - this is what threw against the unserializable subject proxy
        expect(() => _.cloneDeep(consoleProps)).not.to.throw()

        // the unserializable subject is represented by its type, never the proxy
        expect(consoleProps.props.Yielded).to.equal('[unserializable: object]')
      })
    })
  })
})
