import { findCrossOriginLogs } from '../../../../support/utils'

context('cy.origin location', { browser: '!webkit' }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()
  })

  it('.hash()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.hash().should('be.empty')
    })
  })

  it('.location()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.location().should((location) => {
        expect(location.href).to.equal('http://www.foobar.com:3500/fixtures/secondary-origin.html')
        expect(location.origin).to.equal('http://www.foobar.com:3500')
      })
    })
  })

  it('.url()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.url().should('equal', 'http://www.foobar.com:3500/fixtures/secondary-origin.html')
    })
  })

  context('#consoleProps', () => {
    let logs: Map<string, any>

    beforeEach(() => {
      logs = new Map()

      cy.on('log:changed', (attrs, log) => {
        logs.set(attrs.id, log)
      })
    })

    it('.hash()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.hash()
      })

      cy.shouldWithTimeout(() => {
        const { consoleProps } = findCrossOriginLogs('hash', logs, 'foobar.com')

        expect(consoleProps.name).to.equal('hash')
        expect(consoleProps.type).to.equal('command')
      })
    })

    it('.location()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.location()
      })

      cy.shouldWithTimeout(() => {
        const { consoleProps } = findCrossOriginLogs('location', logs, 'foobar.com')

        expect(consoleProps.name).to.equal('location')
        expect(consoleProps.type).to.equal('command')

        expect(consoleProps.props.Yielded).to.have.property('auth').that.is.a('string')
        expect(consoleProps.props.Yielded).to.have.property('authObj').that.is.undefined
        expect(consoleProps.props.Yielded).to.have.property('hash').that.is.a('string')
        expect(consoleProps.props.Yielded).to.have.property('host').that.is.a('string')
        expect(consoleProps.props.Yielded).to.have.property('hostname').that.is.a('string')
        expect(consoleProps.props.Yielded).to.have.property('href').that.is.a('string')
        expect(consoleProps.props.Yielded).to.have.property('origin').that.is.a('string')
        expect(consoleProps.props.Yielded).to.have.property('superDomainOrigin').that.is.a('string')
        expect(consoleProps.props.Yielded).to.have.property('pathname').that.is.a('string')
        expect(consoleProps.props.Yielded).to.have.property('port').that.is.a('string')
        expect(consoleProps.props.Yielded).to.have.property('protocol').that.is.a('string')
        expect(consoleProps.props.Yielded).to.have.property('search').that.is.a('string')
        expect(consoleProps.props.Yielded).to.have.property('superDomain').that.is.a('string')
      })
    })

    it('.url()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.url()
      })

      cy.shouldWithTimeout(() => {
        const { consoleProps } = findCrossOriginLogs('url', logs, 'foobar.com')

        expect(consoleProps.name).to.equal('url')
        expect(consoleProps.type).to.equal('command')

        expect(consoleProps.props.Yielded).to.equal('http://www.foobar.com:3500/fixtures/secondary-origin.html')
      })
    })
  })
})
