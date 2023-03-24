import $elements from '../../../src/dom/elements'
const { getActiveElByDocument, isFocused, elementFromPoint, isFocusedOrInFocused } = $elements
const $ = window.Cypress.$

describe('src/dom/elements', () => {
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
      cy.visit('/fixtures/dom.html').then(() => {
        const $el = $('foo-bar-baz')

        expect(Cypress.dom.isUndefinedOrHTMLBodyDoc($el)).to.be.true
      })
    })

    it('when html', () => {
      cy.visit('/fixtures/dom.html').then(() => {
        const $el = $('html')

        expect(Cypress.dom.isUndefinedOrHTMLBodyDoc($el)).to.be.true
      })
    })

    it('when body', () => {
      cy.visit('/fixtures/dom.html').then(() => {
        const $el = $('body')

        expect(Cypress.dom.isUndefinedOrHTMLBodyDoc($el)).to.be.true
      })
    })

    it('when document', () => {
      cy.visit('/fixtures/dom.html').then(() => {
        const $el = $('document')

        expect(Cypress.dom.isUndefinedOrHTMLBodyDoc($el)).to.be.true
      })
    })

    it('when existing DOM element', () => {
      cy.visit('/fixtures/dom.html').then(() => {
        const $el = $('input')

        expect(Cypress.dom.isUndefinedOrHTMLBodyDoc($el)).to.be.false
      })
    })
  })

  context('.getActiveElByDocument', () => {
    beforeEach(() => {
      cy.visit('/fixtures/active-elements.html')
    })

    it('returns active element by looking it up on document', () => {
      cy.get('input:first').focus().then(($el) => {
        expect(getActiveElByDocument($el)).to.equal($el[0])
      })
    })

    it('returns null if element is not focused', () => {
      cy.get('input:first').then(($el) => {
        expect(getActiveElByDocument($el)).to.be.null
      })
    })

    describe('in the shadow dom', () => {
      beforeEach(() => {
        cy.visit('/fixtures/shadow-dom.html')
      })

      it('returns active element for shadow dom by looking it up on shadow root', () => {
        cy
        .get('#shadow-element-1')
        .find('input', { includeShadowDom: true }).focus().then(($el) => {
          expect(getActiveElByDocument($el)).to.equal($el[0])
        })
      })
    })
  })

  context('.isFocused', () => {
    beforeEach(() => {
      cy.visit('/fixtures/active-elements.html')
    })

    it('returns true if the element is the active element', () => {
      cy.get('input:first').focus().then(($el) => {
        expect(isFocused($el[0])).to.be.true
      })
    })

    it('returns true if the active element is the body and it is contenteditable', () => {
      cy.get('body').focus().then(($body) => {
        $body[0].setAttribute('contenteditable', 'true')
        expect(isFocused($body[0])).to.be.true
      })
    })

    it('returns false if the element is not the active element', () => {
      cy.get('input:first').then(($el) => {
        expect(isFocused($el[0])).to.be.false
      })
    })

    it('returns false if there is no active element', () => {
      cy.get('input:first').focus().then(($el) => {
        $el.blur()
        expect(isFocused($el[0])).to.be.false
      })
    })

    it('returns false if the active element is the body', () => {
      cy.get('body').focus().then(($body) => {
        expect(isFocused($body[0])).to.be.false
      })
    })

    it('returns false if determining the active element errors', () => {
      cy.get('input:first').focus().then(($el) => {
        Object.defineProperty($el[0].ownerDocument, 'activeElement', {
          get () {
            throw new Error('unexpected error')
          },
        })

        expect(isFocused($el[0])).to.be.false
      })
    })

    describe('in the shadow dom', () => {
      it('returns true if the element is the active element of the shadow root', () => {
        cy.visit('/fixtures/shadow-dom.html')
        cy
        .get('#shadow-element-1')
        .find('input', { includeShadowDom: true }).focus().then(($el) => {
          expect(isFocused($el[0])).to.be.true
        })
      })
    })
  })

  context('.elementFromPoint', () => {
    let doc
    let node

    beforeEach(() => {
      node = {}
      doc = {
        elementFromPoint: cy.stub().returns(node),
      }
    })

    it('returns original node if node has no shadow root', () => {
      expect(elementFromPoint(doc, 1, 2)).to.equal(node)
    })

    it('returns shadow dom element at point', () => {
      const shadowNode = {}
      const shadowHostNode = {
        shadowRoot: {
          elementFromPoint: cy.stub().returns(shadowNode),
        },
      }

      doc.elementFromPoint.returns(shadowHostNode)

      expect(elementFromPoint(doc, 1, 2)).to.equal(shadowNode)
    })

    it('returns original node if no element at point in shadow dom', () => {
      const shadowHostNode = {
        shadowRoot: {
          elementFromPoint: cy.stub().returns(node),
        },
      }

      doc.elementFromPoint.returns(shadowHostNode)

      expect(elementFromPoint(doc, 1, 2)).to.equal(node)
    })

    // https://github.com/cypress-io/cypress/issues/7794
    it('returns shadow host if its element at point is itself', () => {
      const shadowHostNode = {} as any

      shadowHostNode.shadowRoot = {
        elementFromPoint: cy.stub().returns(shadowHostNode),
      }

      doc.elementFromPoint.returns(shadowHostNode)

      expect(elementFromPoint(doc, 1, 2)).to.equal(shadowHostNode)
    })
  })

  context('.isFocusedOrInFocused', () => {
    it('should traverse shadow roots when determining if an element has focus', () => {
      cy.visit('/fixtures/shadow-dom-type.html')

      cy.get('test-element').shadow().find('input').focus().then(($input) => {
        expect(isFocusedOrInFocused($input[0])).to.be.true
      })
    })
  })
})
