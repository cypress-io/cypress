import { findCrossOriginLogs } from '../../../../support/utils'

context('cy.origin connectors', { browser: '!webkit' }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('.each()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.get('#by-name>[name="colors"]').each(($element, index) => {
        expect($element.prop('type')).to.equal('checkbox')
      })
    })
  })

  it('.its()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.get('#by-id>input').its('length').should('eq', 3)
    })
  })

  it('.invoke()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.get('#button').invoke('text').should('eq', 'button')
    })
  })

  it('.spread()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      const arr = ['foo', 'bar', 'baz']

      cy.wrap(arr).spread((foo, bar, baz) => {
        expect(foo).to.equal('foo')
        expect(bar).to.equal('bar')
        expect(baz).to.equal('baz')
      })
    })
  })

  it('.then()', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      cy.get('#by-id>input').then(($list) => {
        expect($list).to.have.length(3)
      })
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

    it('.its()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('#by-id>input').its('length')
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const { consoleProps, $el } = findCrossOriginLogs('its', logs, 'foobar.com')

        expect($el.jquery).to.be.ok

        expect(consoleProps.name).to.equal('its')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props.Property).to.equal('.length')
        expect(consoleProps.props.Yielded).to.equal(3)

        expect(consoleProps.props.Subject.length).to.equal(3)

        // make sure subject elements are indexed in the correct order
        expect(consoleProps.props.Subject[0]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props.Subject[0]).to.have.property('id').that.equals('input')

        expect(consoleProps.props.Subject[1]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props.Subject[1]).to.have.property('id').that.equals('name')

        expect(consoleProps.props.Subject[2]).to.have.property('tagName').that.equals('INPUT')
        expect(consoleProps.props.Subject[2]).to.have.property('id').that.equals('age')
      })
    })

    it('.invoke()', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.get('#button').invoke('text')
      })

      cy.shouldWithTimeout(() => {
        // in the case of some firefox browsers, the document state is left in a cross origin context when running these assertions
        // set to  context to undefined to run the assertions
        if (Cypress.isBrowser('firefox')) {
          cy.state('document', undefined)
        }

        const { consoleProps, $el } = findCrossOriginLogs('invoke', logs, 'foobar.com')

        expect($el.jquery).to.be.ok

        expect(consoleProps.name).to.equal('invoke')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props.Function).to.equal('.text()')
        expect(consoleProps.props.Yielded).to.equal('button')

        expect(consoleProps.props.Subject[0]).to.have.property('tagName').that.equals('BUTTON')
        expect(consoleProps.props.Subject[0]).to.have.property('id').that.equals('button')
      })
    })
  })
})
