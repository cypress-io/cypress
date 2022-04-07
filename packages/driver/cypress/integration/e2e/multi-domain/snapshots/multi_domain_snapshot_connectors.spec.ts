import { findCrossOriginLogs } from '../../../../support/utils'

// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain snapshot connectors', { experimentalSessionSupport: true }, () => {
  let logs: Map<string, any>

  beforeEach(() => {
    logs = new Map()

    cy.on('log:changed', (attrs, log) => {
      logs.set(attrs.id, log)
    })

    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  // NOTE: there is no command log for .each()
  it.skip('.each()', () => undefined)

  it('.its()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, $el, crossOriginLog } = findCrossOriginLogs('its', logs, 'foobar.com')

        expect($el.jquery).to.be.ok
        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('its')
        expect(consoleProps.Property).to.equal('.length')
        expect(consoleProps.Yielded).to.equal(3)

        expect(consoleProps.Subject.length).to.equal(3)

        // make sure subject elements are indexed in the correct order
        expect(consoleProps.Subject[0]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.Subject[0]).to.have.property('id').that.equals('input')

        expect(consoleProps.Subject[1]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.Subject[1]).to.have.property('id').that.equals('name')

        expect(consoleProps.Subject[2]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.Subject[2]).to.have.property('id').that.equals('age')

        done()
      }, 250)
    })

    cy.origin('http://foobar.com:3500', () => {
      // FIXME: snapshot of primary is showing for its
      cy.get('#by-id>input').its('length')
    })
  })

  it('.invoke()', (done) => {
    cy.on('command:queue:end', () => {
      setTimeout(() => {
        const { consoleProps, $el, crossOriginLog } = findCrossOriginLogs('invoke', logs, 'foobar.com')

        expect($el.jquery).to.be.ok
        expect(crossOriginLog).to.be.true

        expect(consoleProps.Command).to.equal('invoke')
        expect(consoleProps.Function).to.equal('.text()')
        expect(consoleProps.Yielded).to.equal('button')

        expect(consoleProps.Subject).to.have.property('tagName').that.equals('BUTTON')
        expect(consoleProps.Subject).to.have.property('id').that.equals('button')

        done()
      }, 250)
    })

    cy.origin('http://foobar.com:3500', () => {
      // FIXME: snapshot of primary is showing for its
      cy.get('#button').invoke('text')
    })
  })

  // NOTE: there is no command log for .spread()
  it.skip('.spread()', () => undefined)

  // NOTE: there is no command log for .then()
  it.skip('.then()', () => undefined)
})
