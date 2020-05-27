describe('src/dom/elements', () => {
  const $ = Cypress.$.bind(Cypress)

  context('.isAttached', () => {
    beforeEach(() => {
      cy.visit('/fixtures/iframe-outer.html')
    })

    it('no elements', () => {
      const $el = $(null!)

      expect(Cypress.dom.isAttached($el)).to.be.false
    })

    it('element', () => {
      cy.get('span').then(($span) => {
        expect(Cypress.dom.isAttached($span)).to.be.true

        $span.remove()

        expect(Cypress.dom.isAttached($span)).to.be.false
      })
    })

    it('stale element', (done) => {
      cy.get('span').then(($span) => {
        expect(Cypress.dom.isAttached($span)).to.be.true

        cy.on('window:load', () => {
          expect(Cypress.dom.isAttached($span)).to.be.false

          done()
        })

        cy.window().then((win) => {
          win.location.reload()
        })
      })
    })

    it('window', () => {
      cy.window().then((win) => {
        // windows are always considered attached since
        // their references will be replaced anyway with
        // new windows
        expect(Cypress.dom.isAttached(win)).to.be.true
      })
    })

    it('document', (done) => {
      cy.document().then((doc) => {
      // documents are considered attached only if
      // they have a defaultView (window) which will
      // be null when the documents are stale
        expect(Cypress.dom.isAttached(doc)).to.be.true

        cy.on('window:load', () => {
          expect(Cypress.dom.isAttached(doc)).to.be.false

          done()
        })

        cy.window().then((win) => {
          win.location.reload()
        })
      })
    })

    it('element in iframe', (done) => {
      cy.get('iframe').then(($iframe) => {
        const $doc = $iframe.contents() as JQuery<Document>

        const $btn = $doc.find('button') as unknown as JQuery<HTMLButtonElement>

        expect($btn.length).to.eq(1)

        expect(Cypress.dom.isAttached($btn)).to.be.true

        // when the iframe is reloaded
        $iframe.on('load', () => {
        // the element should be stale now
          expect(Cypress.dom.isAttached($btn)).to.be.false

          done()
        })

        const win = $doc.get(0).defaultView!

        win.location.reload()
      })
    })
  })

  context('.isDetached', () => {
    it('opposite of attached', () => {
      const $el = $(null!)

      expect(Cypress.dom.isDetached($el)).to.be.true
    })
  })

  context('.isInputType', () => {
    beforeEach(() => {
      cy.visit('/fixtures/dom.html')
    })

    it('when type is a string', () => {
      const $el = $('input[type="number"]')

      expect(Cypress.dom.isInputType($el, 'number')).to.be.true
      expect(Cypress.dom.isInputType($el, 'text')).to.be.false
    })

    it('when type is an array', () => {
      const $el = $('input[type="number"]')

      expect(Cypress.dom.isInputType($el, ['number', 'text', 'email'])).to.be.true
      expect(Cypress.dom.isInputType($el, ['text', 'email'])).to.be.false
    })
  })

  context('.isUndefinedOrHTMLBodyDoc', () => {
    it('when $el undefined', () => {
      const $el = undefined

      expect(Cypress.dom.isUndefinedOrHTMLBodyDoc($el)).to.be.true
    })

    it('when $el[0] undefined', () => {
      const $el = []

      expect(Cypress.dom.isUndefinedOrHTMLBodyDoc($el)).to.be.true
    })

    it('DOM element does not exist', () => {
      cy.visit('/fixtures/dom.html')
      const $el = $('foo-bar-baz')

      expect(Cypress.dom.isUndefinedOrHTMLBodyDoc($el)).to.be.true
    })

    it('when html', () => {
      cy.visit('/fixtures/dom.html')
      const $el = $('html')

      expect(Cypress.dom.isUndefinedOrHTMLBodyDoc($el)).to.be.true
    })

    it('when body', () => {
      cy.visit('/fixtures/dom.html')
      const $el = $('body')

      expect(Cypress.dom.isUndefinedOrHTMLBodyDoc($el)).to.be.true
    })

    it('when document', () => {
      cy.visit('/fixtures/dom.html')
      const $el = $('document')

      expect(Cypress.dom.isUndefinedOrHTMLBodyDoc($el)).to.be.true
    })

    it('when existing DOM element', () => {
      cy.visit('/fixtures/dom.html')
      const $el = $('input')

      expect(Cypress.dom.isUndefinedOrHTMLBodyDoc($el)).to.be.false
    })
  })
})
