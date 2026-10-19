// These tests run in order: each one checks what the previous test left behind.
// A test that only runs allowlisted commands leaves the blank page untouched,
// so the next test starts on the same document. Anything else must lead to a
// fresh document before the next test.
const startDocuments: Document[] = []

const recordStartDocument = () => {
  cy.then(() => {
    startDocuments.push(cy.state('document'))
  })
}

const previousStartDocument = () => startDocuments[startDocuments.length - 2]

const expectFreshBlankPage = () => {
  cy.then(() => {
    const doc: Document = cy.state('document')

    expect(doc, 'document').not.to.equal(previousStartDocument())
    expect(doc.location.href).to.equal('about:blank')
    expect(doc.body.innerHTML).to.include('Default blank page')
  })
}

const expectSameBlankPage = () => {
  cy.then(() => {
    const doc: Document = cy.state('document')

    expect(doc, 'document').to.equal(previousStartDocument())
    expect(doc.location.href).to.equal('about:blank')
    expect(doc.body.innerHTML).to.include('Default blank page')
  })
}

describe('test isolation blank page', { testIsolation: true, retries: 0 }, () => {
  beforeEach(recordStartDocument)

  it('navigates after the first test, which has no recorded blank page', () => {})

  it('starts on a fresh blank page', expectFreshBlankPage)

  it('reuses the blank page an untouched test left behind', () => {
    expectSameBlankPage()
    cy.request('/prelogin?redirect=/fixtures/empty.html')
    cy.getCookie('prelogin').should('exist')
  })

  it('still clears cookies when it reuses the blank page', () => {
    expectSameBlankPage()
    cy.getCookies().should('be.empty')
  })

  it('touches the page with cy.visit()', () => {
    expectSameBlankPage()
    cy.visit('/fixtures/empty.html')
  })

  it('navigates after cy.visit()', expectFreshBlankPage)

  it('touches the page with a DOM write through cy.document()', () => {
    expectSameBlankPage()
    cy.document().then((doc) => {
      const el = doc.createElement('div')

      el.id = 'from-previous-test'
      doc.body.appendChild(el)
    })
  })

  it('navigates after a DOM write and drops the appended node', () => {
    expectFreshBlankPage()
    cy.then(() => {
      expect(cy.state('document').getElementById('from-previous-test')).to.be.null
    })
  })

  it('touches the page with a stub and a global through cy.window()', () => {
    expectSameBlankPage()
    cy.window().then((win) => {
      cy.stub(win, 'alert')
      Reflect.set(win, '__fromPreviousTest', true)
    })
  })

  it('navigates after cy.window() and drops the global', () => {
    expectFreshBlankPage()
    cy.then(() => {
      expect(Reflect.get(cy.state('window'), '__fromPreviousTest')).to.be.undefined
    })
  })

  it('touches the page with cy.clock()', () => {
    expectSameBlankPage()
    cy.clock()
  })

  it('navigates after cy.clock()', expectFreshBlankPage)

  it('touches the page with a plugin-style render into the blank page', () => {
    expectSameBlankPage()
    // Only allowlisted commands run, so the DOM change alone must be noticed
    cy.then(() => {
      Cypress.$(cy.state('document').body).append('<div id="plugin-ui">plugin</div>')
    })
  })

  it('navigates after a render into the blank page', () => {
    expectFreshBlankPage()
    cy.then(() => {
      expect(cy.state('document').getElementById('plugin-ui')).to.be.null
    })
  })

  it('touches the page with a custom command', () => {
    expectSameBlankPage()
    // @ts-expect-error - custom command names are not in the Chainable types
    Cypress.Commands.add('apiOnlyCustomCommand', () => {
      cy.wrap(null)
    })

    // @ts-expect-error - custom command added above
    cy.apiOnlyCustomCommand()
  })

  it('navigates after a custom command', expectFreshBlankPage)
})

describe('test isolation blank page after a retry', { testIsolation: true, retries: 1 }, () => {
  let firstAttemptDocument: Document

  it('records an untouched blank page', () => {})

  it('fails its first attempt and passes on retry', () => {
    cy.then(() => {
      if (Cypress.currentRetry === 0) {
        firstAttemptDocument = cy.state('document')
        throw new Error('first attempt fails')
      }

      expect(cy.state('document'), 'document').not.to.equal(firstAttemptDocument)
      startDocuments.push(cy.state('document'))
    })
  })

  it('navigates after a test that needed a retry', () => {
    cy.then(() => {
      expect(cy.state('document'), 'document').not.to.equal(startDocuments[startDocuments.length - 1])
      expect(cy.state('document').location.href).to.equal('about:blank')
    })
  })
})
