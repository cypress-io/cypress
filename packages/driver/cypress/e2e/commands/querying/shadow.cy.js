const { _ } = Cypress

describe('src/cy/commands/querying - shadow dom', () => {
  beforeEach(() => {
    cy.visit('/fixtures/shadow-dom.html')
  })

  context('#shadow', () => {
    it('returns an empty set if no shadow roots exist', () => {
      cy.get('#non-shadow-element').shadow()
      .should('not.exist')
      .then(($root) => {
        expect($root).to.be.null
      })
    })

    it('returns the shadow root of an individual element', () => {
      cy.get('#shadow-element-1').shadow()
      .then(($roots) => {
        expect($roots.length).to.eq(1)
      })
    })

    it('returns a set of shadow roots for a set of elements', () => {
      const $shadowElements = cy.$$('#shadow-element-1, #shadow-element-2')

      cy.get('#shadow-element-1, #shadow-element-2').shadow()
      .then(($roots) => {
        expect($roots.length).to.eq(2)
        expect($roots.get(0)).to.eq($shadowElements.get(0).shadowRoot)
        expect($roots.get(1)).to.eq($shadowElements.get(1).shadowRoot)
      })
    })

    it('retries until it can find a root', () => {
      cy.on('command:retry', _.after(2, () => {
        cy.$$('#non-shadow-element')[0].attachShadow({ mode: 'open' })
      }))

      cy.get('#non-shadow-element').shadow()
      .then(($roots) => {
        expect($roots.length).to.equal(1)
      })
    })

    it('has a custom error message if it cannot find a root', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal(`Timed out retrying after 0ms: Expected the subject to host a shadow root, but never found it.`)
        expect(err.docsUrl).to.equal('https://on.cypress.io/shadow')

        done()
      })

      cy.get('#non-shadow-element').shadow({ timeout: 0 })
    })

    describe('.log', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          this.lastLog = log
        })

        return null
      })

      it('logs immediately before resolving', (done) => {
        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'shadow') {
            expect(log.pick('state')).to.deep.eq({
              state: 'pending',
            })

            done()
          }
        })

        cy.get('#shadow-element-1').shadow()
      })

      it('snapshots after finding element', () => {
        cy.get('#shadow-element-1').shadow()
        .then(function () {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(1)
          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('has the $el', () => {
        cy.get('#shadow-element-1').shadow()
        .then(function ($el) {
          const { lastLog } = this

          expect(lastLog.get('$el').get(0)).to.eq($el.get(0))
        })
      })

      it('#consoleProps', () => {
        cy.get('#shadow-element-1').shadow()
        .then(function ($el) {
          expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
            'Applied To': cy.$$('#shadow-element-1')[0],
            Yielded: Cypress.dom.getElements($el),
            Elements: $el.length,
            Command: 'shadow',
          })
        })
      })

      it('can be turned off', () => {
        cy.get('#shadow-element-1').shadow({ log: false })
        .then(function () {
          const { lastLog } = this

          expect(lastLog.get('name')).to.eq('get')
        })
      })
    })
  })
})
