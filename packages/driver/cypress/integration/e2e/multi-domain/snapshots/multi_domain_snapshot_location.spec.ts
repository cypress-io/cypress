import { findCrossOriginLogs } from '../../../../support/utils'

// @ts-ignore / session support is needed for visiting about:blank between tests
context('cross-origin snapshot location', { experimentalSessionSupport: true }, () => {
  let logs: Map<string, any>

  beforeEach(() => {
    logs = new Map()

    cy.on('log:changed', (attrs, log) => {
      logs.set(attrs.id, log)
    })

    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="multi-domain-secondary-link"]').click()
  })

  it('.hash()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { crossOriginLog, consoleProps } = findCrossOriginLogs('hash', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true
        expect(consoleProps.Command).to.equal('hash')

        done()
      }, 250)
    })

    cy.origin('http://foobar.com:3500', () => {
      cy.hash()
    })
  })

  it('.location()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { crossOriginLog, consoleProps } = findCrossOriginLogs('location', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true
        expect(consoleProps.Command).to.equal('location')

        expect(consoleProps.Yielded).to.have.property('auth').that.is.a('string')
        expect(consoleProps.Yielded).to.have.property('authObj').that.is.undefined
        expect(consoleProps.Yielded).to.have.property('hash').that.is.a('string')
        expect(consoleProps.Yielded).to.have.property('host').that.is.a('string')
        expect(consoleProps.Yielded).to.have.property('hostname').that.is.a('string')
        expect(consoleProps.Yielded).to.have.property('href').that.is.a('string')
        expect(consoleProps.Yielded).to.have.property('origin').that.is.a('string')
        expect(consoleProps.Yielded).to.have.property('originPolicy').that.is.a('string')
        expect(consoleProps.Yielded).to.have.property('pathname').that.is.a('string')
        expect(consoleProps.Yielded).to.have.property('port').that.is.a('string')
        expect(consoleProps.Yielded).to.have.property('protocol').that.is.a('string')
        expect(consoleProps.Yielded).to.have.property('search').that.is.a('string')
        expect(consoleProps.Yielded).to.have.property('superDomain').that.is.a('string')

        done()
      }, 250)
    })

    cy.origin('http://foobar.com:3500', () => {
      cy.location()
    })
  })

  it('.url()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { crossOriginLog, consoleProps } = findCrossOriginLogs('url', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true
        expect(consoleProps.Command).to.equal('url')

        expect(consoleProps.Yielded).to.equal('http://www.foobar.com:3500/fixtures/multi-domain-secondary.html')

        done()
      }, 250)
    })

    cy.origin('http://foobar.com:3500', () => {
      cy.url()
    })
  })
})
