import { assertLogLength } from '../../../../support/utils'

// @ts-ignore / session support is needed for visiting about:blank between tests
context('log', { experimentalSessionSupport: true }, () => {
  let logs: any = []

  beforeEach(() => {
    logs = []

    cy.on('log:added', (attrs, log) => {
      logs.push(log)
    })

    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('it logs in primary and secondary domains', () => {
    cy.switchToDomain('http://foobar.com:3500', () => {
      const afterLogAdded = new Promise<void>((resolve) => {
        const listener = (attrs) => {
          if (attrs.message === 'test log in multi-domain') {
            expect(attrs.message).to.eq('test log in multi-domain')
            expect(attrs.id).to.equal('log-http://foobar.com:3500-7')
            cy.removeListener('log:added', listener)
            resolve()
          }
        }

        cy.on('log:added', listener)
      })

      cy.log('test log in multi-domain')
      cy.wrap(afterLogAdded)
    }).then(() => {
      // Verify the log is also fired in the primary domain.
      expect(logs[6].get('message')).to.eq('test log in multi-domain')
      // Verify the log has the same ID as was generated in the cross-origin
      expect(logs[6].get('id')).to.equal('log-http://foobar.com:3500-7')
      assertLogLength(logs, 12)
    })
  })

  it('has a different id in a second test', () => {
    cy.switchToDomain('http://foobar.com:3500', () => {
      const afterLogAdded = new Promise<void>((resolve) => {
        const listener = (attrs) => {
          if (attrs.message === 'test log in multi-domain') {
            expect(attrs.message).to.eq('test log in multi-domain')
            expect(attrs.id).to.equal('log-http://foobar.com:3500-21')
            cy.removeListener('log:added', listener)
            resolve()
          }
        }

        cy.on('log:added', listener)
      })

      cy.log('test log in multi-domain')
      cy.wrap(afterLogAdded)
    }).then(() => {
      // Verify the log is also fired in the primary domain.
      expect(logs[6].get('message')).to.eq('test log in multi-domain')
      // Verify the log has the same ID as was generated in the cross-origin
      expect(logs[6].get('id')).to.equal('log-http://foobar.com:3500-21')
      assertLogLength(logs, 12)
    })
  })
})
