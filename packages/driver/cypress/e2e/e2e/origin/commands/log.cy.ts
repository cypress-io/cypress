import { assertLogLength } from '../../../../support/utils'

context('cy.origin log', () => {
  let logs: any = []
  let lastTestLogId = ''

  beforeEach(() => {
    logs = []

    cy.on('log:added', (attrs, log) => {
      logs.push(log)
    })

    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('logs in primary and secondary origins', () => {
    cy.origin<string>('http://www.foobar.com:3500', () => {
      const afterLogAdded = new Promise<void>((resolve) => {
        const listener = (attrs) => {
          if (attrs.message === 'test log in cy.origin') {
            expect(attrs.message).to.eq('test log in cy.origin')
            cy.removeListener('log:added', listener)
            resolve(attrs.id)
          }
        }

        cy.on('log:added', listener)
      })

      cy.log('test log in cy.origin')
      cy.wrap(afterLogAdded)
    }).then((id) => {
      lastTestLogId = id
      // Verify the log is also fired in the primary origin.
      expect(logs[6].get('message')).to.eq('test log in cy.origin')
      // Verify the log has the same ID as was generated in the cross-origin
      expect(logs[6].get('id')).to.equal(id)
      assertLogLength(logs, 11)
    })
  })

  it('has a different id in a second test', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      const afterLogAdded = new Promise<void>((resolve) => {
        const listener = (attrs) => {
          if (attrs.message === 'test log in cy.origin') {
            expect(attrs.message).to.eq('test log in cy.origin')
            cy.removeListener('log:added', listener)
            resolve(attrs.id)
          }
        }

        cy.on('log:added', listener)
      })

      cy.log('test log in cy.origin')
      cy.wrap(afterLogAdded)
    }).then((id) => {
      // Verify the log is also fired in the primary origin.
      expect(logs[6].get('message')).to.eq('test log in cy.origin')
      // Verify the log has the same ID as was generated in the cross-origin
      expect(logs[6].get('id')).to.equal(id)
      expect(logs[6].get('id')).to.not.equal(lastTestLogId)
      assertLogLength(logs, 12)
    })
  })
})
