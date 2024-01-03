import { assertLogLength } from '../../../../support/utils'

context('cy.origin log', { browser: '!webkit' }, () => {
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
      lastTestLogId = id as string
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

  it('does not send hidden logs to primary origin when protocol is disabled', { protocolEnabled: false }, function () {
    cy.on('_log:added', (attrs, log) => {
      this.hiddenLog = log
    })

    cy.origin('http://www.foobar.com:3500', () => {
      cy.get('#select-maps').select('train', { log: false })
    }).then((id) => {
      // Verify the log is also fired in the primary origin.
      expect(logs.length).to.eq(7)
      expect(logs[6].get('name'), 'log name').to.eq('get')
      expect(logs[6].get('hidden'), 'log hidden').to.be.false

      expect(this.hiddenLog).to.be.undefined
    })
  })

  it('handles sending hidden logs to primary origin when protocol enabled', { protocolEnabled: true }, function () {
    cy.on('_log:added', (attrs, log) => {
      this.hiddenLog = log
    })

    cy.origin('http://www.foobar.com:3500', () => {
      cy.get('#select-maps').select('train', { log: false })
    }).then((id) => {
      // Verify the log is also fired in the primary origin.
      expect(logs.length).to.eq(7)
      expect(logs[6].get('name'), 'log name').to.eq('get')
      expect(logs[6].get('hidden'), 'log hidden').to.be.false
      expect(this.hiddenLog).to.be.ok
      expect(this.hiddenLog.get('name'), 'log name').to.eq('select')
      expect(this.hiddenLog.get('hidden'), 'log hidden').to.be.true
    })
  })

  describe('creates expected snapshots for log', () => {
    describe('not associated with commands', () => {
      let logsToVerify

      beforeEach(() => {
        logs = []

        cy.origin('http://www.foobar.com:3500', () => {
          Cypress.log({ name: 'log 1', message: 'log without snapshots' })?.end()
          Cypress.log({ name: 'log 2', message: 'log().snapshot()' })?.snapshot().end()
          Cypress.log({ name: 'log 3', message: 'log({ snapshot: true })', snapshot: true })?.end()
          Cypress.log({ name: 'log 4', message: 'log({ snapshot: true, end: true })', snapshot: true, end: true })?.end()
          Cypress.log({ name: 'log 5', message: 'log({ snapshot: true}).set({ snapshot: false })', snapshot: true })?.set({ 'snapshot': false }).end()

          Cypress.log({ name: 'log 6', message: 'log without snapshots' })?.finish()
          Cypress.log({ name: 'log 7', message: 'log().snapshot()' })?.snapshot().finish()
          Cypress.log({ name: 'log 8', message: 'log({ snapshot: true })', snapshot: true })?.finish()
          Cypress.log({ name: 'log 9', message: 'log({ snapshot: true, end: true })', snapshot: true, end: true })?.finish()
          Cypress.log({ name: 'log 10', message: 'log({ snapshot: true}).set({ snapshot: false })', snapshot: true })?.set({ 'snapshot': false }).finish()
        })
        .then(() => {
          logsToVerify = [...logs]
        })
        .wait(1500)
      })

      it('when run mode with protocol enabled', { numTestsKeptInMemory: 0, protocolEnabled: true }, () => {
        // Verify the log is also fired in the primary origin.
        expect(logsToVerify.length).to.eq(11)

        expect(logsToVerify[1].get('name')).to.equal('log 1')
        expect(logsToVerify[1].get('snapshots')).to.be.undefined

        expect(logsToVerify[2].get('name')).to.equal('log 2')
        expect(logsToVerify[2].get('snapshots')).to.have.length(1)

        expect(logsToVerify[3].get('name')).to.equal('log 3')
        expect(logsToVerify[3].get('snapshots')).to.have.length(1)

        expect(logsToVerify[4].get('name')).to.equal('log 4')
        expect(logsToVerify[4].get('snapshots')).to.have.length(1)

        expect(logsToVerify[5].get('name')).to.equal('log 5')
        expect(logsToVerify[5].get('snapshots')).to.have.length(1)

        expect(logsToVerify[6].get('name')).to.equal('log 6')
        expect(logsToVerify[6].get('snapshots')).to.be.undefined

        expect(logsToVerify[7].get('name')).to.equal('log 7')
        expect(logsToVerify[7].get('snapshots')).to.have.length(1)

        expect(logsToVerify[8].get('name')).to.equal('log 8')
        expect(logsToVerify[8].get('snapshots')).to.have.length(1)

        expect(logsToVerify[9].get('name')).to.equal('log 9')
        expect(logsToVerify[9].get('snapshots')).to.have.length(1)

        expect(logsToVerify[10].get('name')).to.equal('log 10')
        expect(logsToVerify[10].get('snapshots')).to.have.length(1)
      })

      it('when run mode with protocol disabled', { numTestsKeptInMemory: 0, protocolEnabled: false }, () => {
        // Verify the log is also fired in the primary origin.
        expect(logsToVerify.length).to.eq(11)

        expect(logsToVerify[1].get('name')).to.equal('log 1')
        expect(logsToVerify[1].get('snapshots')).to.be.undefined

        expect(logsToVerify[2].get('name')).to.equal('log 2')
        expect(logsToVerify[2].get('snapshots')).to.be.undefined

        expect(logsToVerify[3].get('name')).to.equal('log 3')
        expect(logsToVerify[3].get('snapshots')).to.be.undefined

        expect(logsToVerify[4].get('name')).to.equal('log 4')
        expect(logsToVerify[4].get('snapshots')).to.be.undefined

        expect(logsToVerify[5].get('name')).to.equal('log 5')
        expect(logsToVerify[5].get('snapshots')).to.be.undefined

        expect(logsToVerify[6].get('name')).to.equal('log 6')
        expect(logsToVerify[6].get('snapshots')).to.be.undefined

        expect(logsToVerify[7].get('name')).to.equal('log 7')
        expect(logsToVerify[7].get('snapshots')).to.be.undefined

        expect(logsToVerify[8].get('name')).to.equal('log 8')
        expect(logsToVerify[8].get('snapshots')).to.be.undefined

        expect(logsToVerify[9].get('name')).to.equal('log 9')
        expect(logsToVerify[9].get('snapshots')).to.be.undefined

        expect(logsToVerify[10].get('name')).to.equal('log 10')
        expect(logsToVerify[10].get('snapshots')).to.be.undefined
      })
    })

    describe('associated with commands', () => {
      let logsToVerify

      beforeEach(() => {
        logs = []

        cy.origin('http://www.foobar.com:3500', () => {
          // @ts-ignore
          // add custom command to logs are associated to a command like typical cypress command logs would be
          Cypress.Commands.add('commandToRun', () => {
            Cypress.log({ name: 'log 1', message: 'log without snapshots' })?.end()
            Cypress.log({ name: 'log 2', message: 'log().snapshot()' })?.snapshot().end()
            Cypress.log({ name: 'log 3', message: 'log({ snapshot: true })', snapshot: true })?.end()
            Cypress.log({ name: 'log 4', message: 'log({ snapshot: true, end: true })', snapshot: true, end: true })?.end()
            Cypress.log({ name: 'log 5', message: 'log({ snapshot: true}).set({ snapshot: false })', snapshot: true })?.set({ 'snapshot': false }).end()

            Cypress.log({ name: 'log 6', message: 'log without snapshots' })?.finish()
            Cypress.log({ name: 'log 7', message: 'log().snapshot()' })?.snapshot().finish()
            Cypress.log({ name: 'log 8', message: 'log({ snapshot: true })', snapshot: true })?.finish()
            Cypress.log({ name: 'log 9', message: 'log({ snapshot: true, end: true })', snapshot: true, end: true })?.finish()
            Cypress.log({ name: 'log 10', message: 'log({ snapshot: true}).set({ snapshot: false })', snapshot: true })?.set({ 'snapshot': false }).finish()
          })

          // @ts-ignore
          cy.commandToRun()
        })
        .then(() => {
          logsToVerify = [...logs]
        })
        .wait(1500)
      })

      it('when run mode with protocol enabled', { numTestsKeptInMemory: 0, protocolEnabled: true }, () => {
        // Verify the log is also fired in the primary origin.
        expect(logsToVerify.length).to.eq(11)

        expect(logsToVerify[1].get('name')).to.equal('log 1')
        expect(logsToVerify[1].get('snapshots')).to.have.length(1)

        expect(logsToVerify[2].get('name')).to.equal('log 2')
        expect(logsToVerify[2].get('snapshots')).to.have.length(1)

        expect(logsToVerify[3].get('name')).to.equal('log 3')
        expect(logsToVerify[3].get('snapshots')).to.have.length(1)

        expect(logsToVerify[4].get('name')).to.equal('log 4')
        expect(logsToVerify[4].get('snapshots')).to.have.length(1)

        expect(logsToVerify[5].get('name')).to.equal('log 5')
        expect(logsToVerify[5].get('snapshots')).to.have.length(1)

        expect(logsToVerify[6].get('name')).to.equal('log 6')
        expect(logsToVerify[6].get('snapshots')).to.have.length(1)

        expect(logsToVerify[7].get('name')).to.equal('log 7')
        expect(logsToVerify[7].get('snapshots')).to.have.length(2)

        expect(logsToVerify[8].get('name')).to.equal('log 8')
        expect(logsToVerify[8].get('snapshots')).to.have.length(2)

        expect(logsToVerify[9].get('name')).to.equal('log 9')
        expect(logsToVerify[9].get('snapshots')).to.have.length(1)

        expect(logsToVerify[10].get('name')).to.equal('log 10')
        expect(logsToVerify[10].get('snapshots')).to.have.length(1)
      })

      it('when run mode with protocol disabled', { numTestsKeptInMemory: 0, protocolEnabled: false }, () => {
        // Verify the log is also fired in the primary origin.
        expect(logsToVerify.length).to.eq(11)

        expect(logsToVerify[1].get('name')).to.equal('log 1')
        expect(logsToVerify[1].get('snapshots')).to.be.undefined

        expect(logsToVerify[2].get('name')).to.equal('log 2')
        expect(logsToVerify[2].get('snapshots')).to.be.undefined

        expect(logsToVerify[3].get('name')).to.equal('log 3')
        expect(logsToVerify[3].get('snapshots')).to.be.undefined

        expect(logsToVerify[4].get('name')).to.equal('log 4')
        expect(logsToVerify[4].get('snapshots')).to.be.undefined

        expect(logsToVerify[5].get('name')).to.equal('log 5')
        expect(logsToVerify[5].get('snapshots')).to.be.undefined

        expect(logsToVerify[6].get('name')).to.equal('log 6')
        expect(logsToVerify[6].get('snapshots')).to.be.undefined

        expect(logsToVerify[7].get('name')).to.equal('log 7')
        expect(logsToVerify[7].get('snapshots')).to.be.undefined

        expect(logsToVerify[8].get('name')).to.equal('log 8')
        expect(logsToVerify[8].get('snapshots')).to.be.undefined

        expect(logsToVerify[9].get('name')).to.equal('log 9')
        expect(logsToVerify[9].get('snapshots')).to.be.undefined

        expect(logsToVerify[10].get('name')).to.equal('log 10')
        expect(logsToVerify[10].get('snapshots')).to.be.undefined
      })
    })
  })
})
