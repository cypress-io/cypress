const getFakeWindowWithLocation = ($win: Window) => {
  return {
    document: $win.document,
    location: {
      someFn: cy.stub(),
      someProp: 'foo',
      href: 'original',
      assign: cy.stub(),
      replace: cy.stub(),
    },
  }
}

describe('src/cypress/resolvers', function () {
  context('#resolveWindowReferences', function () {
    it('returns bound fn if prop is fn', function () {
      const unboundFn = function () {
        return this
      }
      const unboundFnWindow = {
        parent: unboundFn,
      }

      // @ts-ignore
      cy.spy(unboundFn, 'bind')

      const actual = Cypress.resolveWindowReference({}, unboundFnWindow, 'parent')

      expect(actual).to.be.instanceOf(Function)
      expect(actual()).to.eq(unboundFnWindow)
      expect(unboundFn.bind).to.be.calledWith(unboundFnWindow)
    })

    context('returns proxied location object', function () {
      it('if prop is location and obj is a Window', function () {
        const contentWindow = Cypress.state('$autIframe')!.prop('contentWindow')
        const actual = Cypress.resolveWindowReference(contentWindow, contentWindow, 'location')

        cy.stub(Cypress.dom, 'isWindow').withArgs(contentWindow).returns(true)
        cy.stub(Cypress.dom, 'isJquery').withArgs(contentWindow).returns(false)

        expect(actual).to.eq(Cypress.resolveLocationReference(contentWindow))
      })

      it('if prop is location and obj is a Document', function () {
        const contentWindow = Cypress.state('$autIframe')!.prop('contentWindow')
        const { document } = contentWindow
        const actual = Cypress.resolveWindowReference(contentWindow, document, 'location')

        cy.stub(Cypress.dom, 'isDocument').withArgs(document).returns(true)

        expect(actual).to.eq(Cypress.resolveLocationReference(contentWindow))
      })
    })

    context('window reference selection', function () {
      const cypressFrame = {
        name: 'cypressFrame',
        parent: null as unknown,
        top: null as unknown,
      }

      cypressFrame.parent = cypressFrame.top = cypressFrame

      const autIframe = {
        name: 'autIframe',
        parent: cypressFrame,
        top: cypressFrame,
      }

      const nestedIframe = {
        name: 'nestedIframe',
        parent: autIframe,
        top: cypressFrame,
      }

      const doublyNestedIframe = {
        name: 'doublyNestedIframe',
        parent: nestedIframe,
        top: cypressFrame,
      }

      ;[
        {
          name: 'returns autIframe given parent call in autIframe',
          currentWindow: autIframe,
          accessedObject: autIframe,
          accessedProp: 'parent',
          expected: autIframe,
        },
        {
          name: 'returns autIframe given top call in autIframe',
          currentWindow: autIframe,
          accessedObject: autIframe,
          accessedProp: 'top',
          expected: autIframe,
        },
        {
          name: 'returns autIframe given parent call in nestedIframe',
          currentWindow: nestedIframe,
          accessedObject: nestedIframe,
          accessedProp: 'parent',
          expected: autIframe,
        },
        {
          name: 'returns autIframe given top call in nestedIframe',
          currentWindow: nestedIframe,
          accessedObject: nestedIframe,
          accessedProp: 'top',
          expected: autIframe,
        },
        {
          name: 'returns nestedIframe given parent call in doublyNestedIframe',
          currentWindow: doublyNestedIframe,
          accessedObject: doublyNestedIframe,
          accessedProp: 'parent',
          expected: nestedIframe,
        },
        {
          name: 'returns autIframe given top call in doublyNestedIframe',
          currentWindow: doublyNestedIframe,
          accessedObject: doublyNestedIframe,
          accessedProp: 'top',
          expected: autIframe,
        },
      ]
      // .slice(0, 1)
      .forEach(({ name, currentWindow, accessedObject, accessedProp, expected }) => {
        it(name, function () {
          const isWindow = cy.stub(Cypress.dom, 'isWindow')
          const isJquery = cy.stub(Cypress.dom, 'isJquery')
          const state = cy.stub(Cypress, 'state')

          state.withArgs('$autIframe').returns({
            prop: cy.stub().withArgs('contentWindow').returns(autIframe),
          })

          ;[cypressFrame, autIframe, nestedIframe, doublyNestedIframe].forEach((frame) => {
            isWindow.withArgs(frame).returns(true)
            isJquery.withArgs(frame).returns(false)
          })

          const actual = Cypress.resolveWindowReference(currentWindow, accessedObject, accessedProp)

          expect(actual).to.eq(expected)
        })
      })
    })
  })

  context('#resolveLocationReference', function () {
    let fakeWindow

    beforeEach(() => {
      cy.visit('/fixtures/generic.html')
      .then(($win) => {
        fakeWindow = getFakeWindowWithLocation($win)
      })
    })

    it('.href setter sets location.href with resolved URL', () => {
      const loc = Cypress.resolveLocationReference(fakeWindow)

      loc.href = 'foo'

      expect(fakeWindow.location.href).to.eq('http://localhost:3500/fixtures/foo')
    })

    it('.assign() calls location.assign with resolved URL', () => {
      const loc = Cypress.resolveLocationReference(fakeWindow)

      loc.assign('foo')

      expect(fakeWindow.location.assign).to.be.calledWith('http://localhost:3500/fixtures/foo')
    })

    it('.replace() calls location.replace with resolved URL', () => {
      const loc = Cypress.resolveLocationReference(fakeWindow)

      loc.replace('foo')

      expect(fakeWindow.location.replace).to.be.calledWith('http://localhost:3500/fixtures/foo')
    })

    it('calls through to unintercepted functions', () => {
      const loc = Cypress.resolveLocationReference(fakeWindow)

      loc.someFn('foo')

      expect(fakeWindow.location.someFn).to.be.calledWith('foo')
    })

    it('calls through to unintercepted setters + getters', () => {
      const loc = Cypress.resolveLocationReference(fakeWindow)

      expect(loc.someProp).to.eq('foo')

      loc.someProp = 'bar'

      expect(loc.someProp).to.eq('bar')
      expect(fakeWindow.location.someProp).to.eq('bar')
    })

    it('returns the same object between calls', () => {
      const loc1 = Cypress.resolveLocationReference(fakeWindow)
      const loc2 = Cypress.resolveLocationReference(fakeWindow)

      expect(loc1).to.eq(loc2)
      expect(fakeWindow.__cypressFakeLocation).to.eq(loc1)
      expect(fakeWindow.__cypressFakeLocation).to.eq(loc2)
    })
  })
})
