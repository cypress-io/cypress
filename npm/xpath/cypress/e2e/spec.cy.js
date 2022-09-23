/// <reference types="cypress" />
/// <reference path="../../src/index.d.ts" />

describe('cypress-xpath', () => {
  it('adds xpath command', () => {
    expect(cy).property('xpath').to.be.a('function')
  })

  context('elements', () => {
    beforeEach(() => {
      cy.visit('cypress/e2e/index.html')
    })

    it('finds h1', () => {
      cy.xpath('//h1').should('have.length', 1)
    })

    it('returns jQuery wrapped elements', () => {
      cy.xpath('//h1').then((el$) => {
        expect(el$).to.have.property('jquery')
      })
    })

    it('returns primitives as is', () => {
      cy.xpath('string(//h1)').then((el$) => {
        expect(el$).to.not.have.property('jquery')
      })
    })

    it('provides jQuery wrapped elements to assertions', () => {
      cy.xpath('//h1').should((el$) => {
        expect(el$).to.have.property('jquery')
      })
    })

    it('gets h1 text', () => {
      cy.xpath('//h1/text()')
      .its('0.textContent')
      .should('equal', 'cypress-xpath')
    })

    it('retries until element is inserted', () => {
      // the element will be inserted after 1 second
      cy.xpath('string(//*[@id="inserted"])').should('equal', 'inserted text')
    })

    describe('chaining', () => {
      it('finds h1 within main', () => {
        // first assert that h1 doesn't exist as a child of the implicit document subject
        cy.xpath('./h1').should('not.exist')

        cy.xpath('//main').xpath('./h1').should('exist')
      })

      it('finds body outside of main when succumbing to // trap', () => {
        // first assert that body doesn't actually exist within main
        cy.xpath('//main').xpath('.//body').should('not.exist')

        cy.xpath('//main').xpath('//body').should('exist')
      })

      it('finds h1 within document', () => {
        cy.document().xpath('//h1').should('exist')
      })

      it('throws when subject is more than a single element', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq(
            'xpath() can only be called on a single element. Your subject contained 2 elements.',
          )

          done()
        })

        cy.get('main, div').xpath('foo')
      })
    })

    describe('within()', () => {
      it('finds h1 within within-subject', () => {
        // first assert that h1 doesn't exist as a child of the implicit document subject
        cy.xpath('./h1').should('not.exist')

        cy.xpath('//main').within(() => {
          cy.xpath('./h1').should('exist')
        })
      })

      it('finds body outside of within-subject when succumbing to // trap', () => {
        // first assert that body doesn't actually exist within main
        cy.xpath('//main').within(() => {
          cy.xpath('.//body').should('not.exist')
        })

        cy.xpath('//main').within(() => {
          cy.xpath('//body').should('exist')
        })
      })
    })

    describe('primitives', () => {
      it('counts h1 elements', () => {
        cy.xpath('count(//h1)').should('equal', 1)
      })

      it('returns h1 text content', () => {
        cy.xpath('string(//h1)').should('equal', 'cypress-xpath')
      })

      it('returns boolean', () => {
        cy.xpath('boolean(//h1)').should('be.true')
        cy.xpath('boolean(//h2)').should('be.false')
      })
    })

    describe('typing', () => {
      it('works on text input', () => {
        cy.xpath('//*[@id="name"]').type('World')
        cy.contains('span#greeting', 'Hello, World')
      })
    })

    describe('clicking', () => {
      it('on button', () => {
        // this button invokes window.alert when clicked
        const alert = cy.stub()

        cy.on('window:alert', alert)
        cy.xpath('//*[@id="first-button"]')
        .click()
        .then(() => {
          expect(alert).to.have.been.calledOnce
        })
      })
    })
  })

  context('logging', () => {
    beforeEach(() => {
      cy.visit('cypress/e2e/index.html')
    })

    it('should log by default', () => {
      cy.spy(Cypress, 'log').log(false)

      cy.xpath('//h1').then(() => {
        expect(Cypress.log).to.be.calledWithMatch({ name: 'xpath' })
      })
    })

    it('logs the selector when not found', (done) => {
      cy.xpath('//h1') // does exist
      cy.on('fail', (e) => {
        const isExpectedErrorMessage = (message) => {
          return message.includes('Timed out retrying') &&
          message.includes(
            'Expected to find element: `//h2`, but never found it.',
          )
        }

        if (!isExpectedErrorMessage(e.message)) {
          console.error('Cypress test failed with an unexpected error message')
          console.error(e)

          return done(e)
        }

        // no errors, the error message for not found selector is correct
        done()
      })

      cy.xpath('//h2', { timeout: 100 }) // does not exist
    })

    it('should not log when provided log: false', () => {
      cy.spy(Cypress, 'log').log(false)

      cy.xpath('//h1', { log: false }).then(() => {
        expect(Cypress.log).to.not.be.calledWithMatch({ name: 'xpath' })
      })
    })
  })
})
