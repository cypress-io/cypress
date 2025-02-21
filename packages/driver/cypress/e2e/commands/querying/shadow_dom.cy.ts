// @ts-expect-error TODO: fix this reference
const { _ } = Cypress

describe('src/cy/commands/querying - shadow dom', () => {
  beforeEach(() => {
    cy.visit('/fixtures/shadow-dom.html')
  })

  context('#get', () => {
    it('finds elements within shadow roots', () => {
      cy.get('.shadow-1', { includeShadowDom: true })
      .should('have.text', 'Shadow Content 1')
    })

    it('finds shadow elements within shadow roots', () => {
      cy.get('.shadow-5', { includeShadowDom: true })
      .should('have.text', 'Shadow Content 5')
    })

    it('finds light elements within shadow slots', () => {
      cy.get('.in-shadow-slot', { includeShadowDom: true })
      .should('have.text', 'In Shadow Slot')
    })

    // TODO: enable once we support cross-boundary selectors nicely
    it.skip('finds elements within shadow roots with cross-boundary selector', () => {
      cy.get('#parent-of-shadow-container-0 .shadow-3', { includeShadowDom: true })
      .should('have.text', 'Shadow Content 3')
    })

    it('finds elements outside shadow roots', () => {
      cy.get('#non-shadow-element', { includeShadowDom: true })
      .should('have.text', 'Non Shadow')
    })

    it('finds elements in and out of shadow roots', () => {
      cy.get('.in-and-out', { includeShadowDom: true })
      .should('have.length', 2)
    })

    // https://github.com/cypress-io/cypress/issues/7676
    it('does not error when querySelectorAll is wrapped and snapshots are off', () => {
      cy.visit('/fixtures/shadow-dom.html?wrap-qsa=true')
      cy.get('.shadow-1', { includeShadowDom: true })
    })

    describe('non-command options', () => {
      describe('suite-level config', { includeShadowDom: true }, () => {
        beforeEach(() => {
          cy.get('.shadow-div')
        })

        it('queries shadow dom', () => {
          cy.get('.shadow-div')
        })

        it('also queries shadow dom', () => {
          cy.get('.shadow-div')
        })
      })

      describe('test-level config', () => {
        it('queries shadow dom', { includeShadowDom: true }, () => {
          cy.get('.shadow-div')
        })

        it('does not find element without option set', () => {
          cy.get('.shadow-div').should('not.exist')
        })
      })

      describe('Cypress.config()', () => {
        const reset = () => {
          Cypress.config('includeShadowDom', false)
        }

        beforeEach(reset)
        afterEach(reset)

        it('turns option on and off at will', () => {
          cy.get('.shadow-div').should('not.exist').then(() => {
            Cypress.config('includeShadowDom', true)
          })

          cy.get('.shadow-div')
        })

        it('overrides test-level option being true', { includeShadowDom: true }, () => {
          Cypress.config('includeShadowDom', false)

          cy.get('.shadow-div').should('not.exist')
        })

        it('overrides test-level option being false', { includeShadowDom: false }, () => {
          Cypress.config('includeShadowDom', true)

          cy.get('.shadow-div')
        })
      })
    })
  })

  context('#contains', () => {
    it('finds element within shadow dom based on text content', () => {
      cy
      .contains('Shadow Content 1', { includeShadowDom: true })
      .should('have.class', 'shadow-1')
    })

    it('finds element within shadow dom based on text content, scoped to selector', () => {
      cy
      .contains('.shadow-11-scope', 'Find Me With cy.contains', { includeShadowDom: true })
      .should('have.length', 1)
    })

    it('finds element within shadow dom based when already past shadow root', () => {
      cy
      .get('#shadow-element-1')
      .shadow()
      .contains('Shadow Content 1')
      .should('have.class', 'shadow-1')
    })
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
            name: 'shadow',
            type: 'command',
            props: {
              'Applied To': cy.$$('#shadow-element-1')[0],
              Yielded: Cypress.dom.getElements($el),
              Elements: $el.length,
            },
          })
        })
      })

      it('can turn off logging when protocol is disabled', { protocolEnabled: false }, function () {
        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })

        cy.get('#shadow-element-1').shadow({ log: false })
        .then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog.get('name')).to.eq('get')
          expect(hiddenLog).to.be.undefined
        })
      })

      it('can send hidden log when protocol is enabled', { protocolEnabled: true }, function () {
        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })

        cy.get('#shadow-element-1').shadow({ log: false })
        .then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog.get('name')).to.eq('get')

          expect(hiddenLog.get('name')).to.eq('shadow')
          expect(hiddenLog.get('hidden')).to.be.true
          expect(hiddenLog.get('snapshots')).to.have.length(1)
        })
      })
    })
  })
})
