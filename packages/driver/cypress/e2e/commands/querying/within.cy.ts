import { assertLogLength } from '../../../support/utils'

const { _ } = Cypress

describe('src/cy/commands/querying/within', () => {
  context('#within', () => {
    beforeEach(() => {
      cy.visit('/fixtures/dom.html')
    })

    it('invokes callback function with runnable.ctx', function () {
      const ctx = this

      cy.get('div:first').within(function () {
        expect(ctx === this).to.be.true
      })
    })

    it('scopes additional GET finders to the subject', () => {
      const input = cy.$$('#by-name input:first')

      cy.get('#by-name').within(() => {
        cy.get('input:first').then(($input) => {
          expect($input.get(0)).to.eq(input.get(0))
        })
      })
    })

    it('scopes additional CONTAINS finders to the subject', () => {
      const span = cy.$$('#nested-div span:contains(foo)')

      cy.contains('foo').then(($span) => {
        const firstSpan = $span?.[0] as unknown as HTMLElement

        expect(firstSpan).not.to.eq(span.get(0))
      })

      cy.get('#nested-div').within(() => {
        cy.contains('foo').then(($span) => {
          const firstSpan = $span?.[0] as unknown as HTMLElement

          expect(firstSpan).to.eq(span.get(0))
        })
      })
    })

    it('does not change the subject', () => {
      const form = cy.$$('#by-name')

      cy.get('#by-name').within(() => {}).then(($form) => {
        expect($form.get(0)).to.eq(form.get(0))
      })
    })

    it('can be chained off an alias', () => {
      const form = cy.$$('#by-name')

      cy.get('#by-name').as('nameForm')
      .within(() => {})
      .then(($form) => {
        expect($form.get(0)).to.eq(form.get(0))
      })

      cy.get('#by-name').as('nameForm')
      .within(() => {
        cy.get('input').should('be.visible')
      })

      cy.get('@nameForm').should('be.visible')
    })

    it('can call child commands after within on the same subject', () => {
      const input = cy.$$('#by-name input:first')

      cy.get('#by-name').within(() => {}).find('input:first').then(($input) => {
        expect($input.get(0)).to.eq(input.get(0))
      })
    })

    it('supports nested withins', () => {
      const span = cy.$$('#button-text button span')

      cy.get('#button-text').within(() => {
        cy.get('button').within(() => {
          cy.get('span').then(($span) => {
            expect($span.get(0)).to.eq(span.get(0))
          })
        })
      })
    })

    it('supports complicated nested withins', () => {
      const span1 = cy.$$('#button-text a span')
      const span2 = cy.$$('#button-text button span')

      cy.get('#button-text').within(() => {
        cy.get('a').within(() => {
          cy.get('span').then(($span) => {
            expect($span.get(0)).to.eq(span1.get(0))
          })
        })

        cy.get('button').within(() => {
          cy.get('span').then(($span) => {
            expect($span.get(0)).to.eq(span2.get(0))
          })
        })
      })
    })

    it('clears withinSubjectChain after within is over', () => {
      const input = cy.$$('input:first')
      const span = cy.$$('#button-text button span')

      cy.get('#button-text').within(() => {
        cy.get('button').within(() => {
          cy.get('span').then(($span) => {
            expect($span.get(0)).to.eq(span.get(0))
          })
        })
      })

      cy.get('input:first').then(($input) => {
        expect($input.get(0)).to.eq(input.get(0))
      })
    })

    it('removes command:start listeners after within is over', () => {
      cy.get('#button-text').within(() => {
        cy.get('button').within(() => {
          cy.get('span')
        })
      })

      cy.then(() => {
        // @ts-expect-error - TODO: Look at where cy._events would be defined
        expect(cy._events).not.to.have.property('command:start')
      })
    })

    it('clears withinSubjectChain even if next is null', (done) => {
      const span = cy.$$('#button-text button span')

      // should be defined here because next would have been
      // null and withinSubjectChain would not have been cleared
      cy.once('command:queue:before:end', () => {
        expect(cy.state('withinSubjectChain')).not.to.be.undefined
      })

      cy.once('command:queue:end', () => {
        expect(cy.state('withinSubjectChain')).to.be.null

        done()
      })

      cy.get('#button-text').within(() => {
        cy.get('button span').then(($span) => {
          expect($span.get(0)).to.eq(span.get(0))
        })
      })
    })

    // https://github.com/cypress-io/cypress/issues/4757
    it('subject is restored after within() call', () => {
      cy.get('#wrapper').within(() => {
        cy.get('#upper').should('contain.text', 'New York')
      })
      .should('have.id', 'wrapper')
    })

    // https://github.com/cypress-io/cypress/issues/5183
    it('contains() works after within() call', () => {
      cy.get(`#wrapper`).within(() => cy.get(`#upper`)).should(`contain.text`, `New York`)
      cy.contains(`button`, `button`).should(`exist`)
    })

    it('re-queries if withinSubject is detached from dom', () => {
      cy.on('command:retry', _.after(2, (options) => {
        cy.$$('#wrapper').replaceWith('<div id="wrapper"><div id="upper">Newer York</div></div>')
      }))

      cy.get('#wrapper').within(() => {
        cy.get(`#upper`).should(`contain.text`, `Newer York`)
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (attrs.name === 'within') {
            this.lastLog = log

            this.logs.push(log)
          }
        })

        return null
      })

      it('can turn off logging when protocol is disabled', { protocolEnabled: false }, function () {
        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })

        cy.get('div:first').within({ log: false }, () => {}).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog).to.be.undefined
        })
      })

      it('can send hidden log when protocol is enabled', { protocolEnabled: true }, function () {
        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })

        cy.get('div:first').within({ log: false }, () => {}).then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog).to.be.undefined
          expect(hiddenLog.get('name')).to.eq('within')
          expect(hiddenLog.get('hidden')).to.be.true
          expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(1)
        })
      })

      it('logs immediately before resolving', (done) => {
        const div = cy.$$('div:first')

        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'within') {
            expect(log.get('state')).to.eq('pending')
            expect(log.get('message')).to.eq('')
            expect(log.get('$el').get(0)).to.eq(div.get(0))

            done()
          }
        })

        cy.get('div:first').within(() => {})
      })

      it('snapshots after clicking', () => {
        cy.get('div:first').within(() => {})
        .then(function () {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(1)

          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('provides additional information in console prop', () => {
        cy.get('div').first().within(() => {})
        cy.then(function () {
          const { lastLog } = this

          const consoleProps = lastLog.get('consoleProps')()

          expect(consoleProps).to.be.an('object')
          expect(consoleProps.name).to.eq('within')
          expect(consoleProps.type).to.eq('command')
          expect(consoleProps.props.Yielded).to.not.be.null
        })
      })
    })

    describe('errors', {
      defaultCommandTimeout: 100,
    }, () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          this.logs.push(log)
        })

        return null
      })

      it('logs once when not dom subject', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.noop().within(() => {})
      })

      it('throws when not a DOM subject', (done) => {
        cy.on('fail', (err) => {
          done()
        })

        cy.noop().within(() => {})
      })

      _.each(['', [], {}, 1, null, undefined], (value) => {
        it(`throws if passed anything other than a function, such as: ${value}`, (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.include('`cy.within()` must be called with a function.')
            expect(err.docsUrl).to.eq('https://on.cypress.io/within')

            done()
          })

          // @ts-expect-error - testing invalid input
          cy.get('body').within(value)
        })
      })

      it('throws when subject is not in the document', (done) => {
        cy.on('command:end', () => {
          cy.$$('#list').remove()
        })

        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.within()` failed because it requires a DOM element')

          done()
        })

        cy.get('#list').within(() => {})
      })

      it('throws when given multiple subjects', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.within()` can only be called on a single element. Your subject contained 9 elements.')

          done()
        })

        cy.get('ul').within(() => {})
      })
    })
  })

  context('#within - shadow dom', () => {
    beforeEach(() => {
      cy.visit('/fixtures/shadow-dom.html')
    })

    it('finds element within shadow dom with includeShadowDom option', () => {
      cy.get('#parent-of-shadow-container-0').within(() => {
        cy
        .get('p', { includeShadowDom: true })
        .should('have.length', 1)
        .should('have.text', 'Shadow Content 3')
      })
    })

    it('when within subject is shadow root, finds element without needing includeShadowDom option', () => {
      cy.get('#shadow-element-1').shadow().within(() => {
        cy
        .get('p')
        .should('have.length', 1)
        .should('have.text', 'Shadow Content 1')
      })
    })

    it('when within subject is already in shadow dom, finds element without needing includeShadowDom option', () => {
      cy.get('.shadow-8-nested-1', { includeShadowDom: true }).within(() => {
        cy
        .get('.shadow-8-nested-5')
        .should('have.text', '8')
      })
    })
  })
})
