const cypressFrame = {
  name: 'cypressFrame',
  parent: null,
  top: null,
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

describe('src/cypress/resolve_window_reference', function () {
  context('resolves correctly', function () {
    it('returns bound fn if prop is fn', function () {
      const unboundFn = function () {
        return this
      }
      const unboundFnWindow = {
        parent: unboundFn,
      }

      // @ts-ignore
      cy.spy(unboundFn, 'bind')

      // @ts-ignore
      const actual = Cypress.resolveWindowReference({}, unboundFnWindow, 'parent')

      expect(actual).to.be.instanceOf(Function)
      expect(actual()).to.eq(unboundFnWindow)
      expect(unboundFn.bind).to.be.calledWith(unboundFnWindow)
    })

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
    .forEach((test) => {
      it(test.name, function () {
        const isWindow = cy.stub(Cypress.dom, 'isWindow')
        const isJquery = cy.stub(Cypress.dom, 'isJquery')
        const state = cy.stub(Cypress, 'state')

        state.withArgs('$autIframe').returns({
          prop: cy.stub().withArgs('contentWindow').returns(autIframe),
        })

        ;[cypressFrame, autIframe, nestedIframe].forEach((frame) => {
          isWindow.withArgs(frame).returns(true)
          isJquery.withArgs(frame).returns(false)
        })

        // @ts-ignore
        const actual = Cypress.resolveWindowReference(test.currentWindow, test.accessedObject, test.accessedProp)

        expect(actual).to.eq(test.expected)
      })
    })
  })
})
