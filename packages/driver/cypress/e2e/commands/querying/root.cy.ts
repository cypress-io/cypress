// @ts-expect-error TODO: fix this reference
const { _ } = Cypress

describe('src/cy/commands/querying', () => {
  beforeEach(() => {
    cy.visit('/fixtures/dom.html')
  })

  context('#root', () => {
    it('returns html', () => {
      const html = cy.$$('html')

      cy.root().then(($html) => {
        expect($html.get(0)).to.eq(html.get(0))
      })
    })

    it('returns withinSubject if exists', () => {
      const form = cy.$$('form')

      cy.get('form').first().within(() => {
        cy
        .get('input')
        .root().then(($root) => {
          expect($root.get(0)).to.eq(form.get(0))
        })
      })
    })

    it('eventually resolves', () => {
      _.delay(() => {
        cy.$$('html').addClass('foo').addClass('bar')
      }
      , 100)

      cy.root().should('have.class', 'foo').and('have.class', 'bar')
    })

    // https://github.com/cypress-io/cypress/issues/19985
    it('respects timeout option', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.not.contain('4000ms')
        done()
      })

      cy.root({ timeout: 50 }).should('contain', 'root world')
    })

    describe('.log', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          this.lastLog = log
        })
      })

      it('can turn off logging when protocol is disabled', { protocolEnabled: false }, function () {
        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })

        cy.root({ log: false })
        .then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.undefined
        })
      })

      it('can send hidden log when protocol is enabled', { protocolEnabled: true }, function () {
        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })

        cy.root({ log: false })
        .then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog.get('name')).to.eq('root')
          expect(hiddenLog.get('hidden')).to.be.true
          expect(hiddenLog.get('snapshots')).to.have.length(1)
        })
      })

      it('logs immediately before resolving', (done) => {
        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'root') {
            expect(log.get('state')).to.eq('pending')
            expect(log.get('message')).to.eq('')

            done()
          }
        })

        cy.root()
      })

      it('snapshots after clicking', () => {
        cy.root().then(function () {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(1)

          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('sets $el to document', () => {
        const html = cy.$$('html')

        cy.root().then(function () {
          expect(this.lastLog.get('$el').get(0)).to.eq(html.get(0))
        })
      })

      it('sets $el to withinSubject', () => {
        const form = cy.$$('form')

        cy.get('form').first().within(() => {
          cy
          .get('input')
          .root().then(function ($root) {
            expect(this.lastLog.get('$el').get(0)).to.eq(form.get(0))
          })
        })
      })

      it('consoleProps', () => {
        cy.root().then(function ($root) {
          const consoleProps = this.lastLog.invoke('consoleProps')

          expect(consoleProps).to.deep.eq({
            name: 'root',
            type: 'command',
            props: {
              Yielded: $root.get(0),
            },
          })
        })
      })
    })
  })
})
