import { findCrossOriginLogs } from '../../../../support/utils'

// @ts-ignore
context('multi-domain navigation', { experimentalSessionSupport: true }, () => {
  let logs: Map<string, any>

  beforeEach(() => {
    logs = new Map()

    cy.on('log:changed', (attrs, log) => {
      logs.set(attrs.id, log)
    })
  })

  it('.go()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, crossOriginLog, ...attrs } = findCrossOriginLogs('go', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true
        expect(attrs.name).to.equal('go')
        expect(attrs.message).to.equal('back')

        expect(consoleProps.Command).to.equal('go')
        expect(consoleProps.Yielded).to.be.null

        done()
      }, 250)
    })

    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="multi-domain-secondary-link"]').click()

    cy.origin('http://foobar.com:3500', () => {
      cy.visit('http://www.foobar.com:3500/fixtures/dom.html')

      cy.go('back')
    })
  })

  it('.reload()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, crossOriginLog, ...attrs } = findCrossOriginLogs('reload', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true
        expect(attrs.name).to.equal('reload')
        expect(attrs.message).to.equal('')

        expect(consoleProps.Command).to.equal('reload')
        expect(consoleProps.Yielded).to.be.null

        done()
      }, 250)
    })

    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="dom-link"]').click()

    cy.origin('http://foobar.com:3500', () => {
      cy.reload()
    })
  })

  it('visit()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, crossOriginLog, ...attrs } = findCrossOriginLogs('visit', logs, 'foobar.com')

        expect(crossOriginLog).to.be.true
        expect(attrs.name).to.equal('visit')
        expect(attrs.message).to.equal('http://www.foobar.com:3500/fixtures/multi-domain-secondary.html')

        expect(consoleProps.Command).to.equal('visit')
        expect(consoleProps).to.have.property('Cookies Set').that.is.an('object')
        expect(consoleProps).to.have.property('Redirects').that.is.an('object')
        expect(consoleProps).to.have.property('Resolved Url').that.equals('http://www.foobar.com:3500/fixtures/multi-domain-secondary.html')

        done()
      }, 250)
    })

    cy.visit('/fixtures/multi-domain.html')

    cy.origin('http://foobar.com:3500', () => {
      cy.visit('http://www.foobar.com:3500/fixtures/multi-domain-secondary.html')

      cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary domain')
    })
  })
})
