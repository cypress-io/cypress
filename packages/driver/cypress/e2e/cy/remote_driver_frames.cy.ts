const PAGE = 'http://localhost:3500/fixtures/remote-driver-frames.html'

describe('remote driver: iframes in the AUT', { experimentalRemoteDriver: true }, () => {
  beforeEach(() => {
    cy.visit(PAGE)
  })

  it('types and clicks in a same-origin iframe', () => {
    cy.get('#same').frame().find('#origin').should('have.text', 'http://localhost:3500')
    cy.get('#same').frame().find('#card').type('4242 4242').should('have.value', '4242 4242')
    cy.get('#same').frame().find('#pay').click()
    cy.get('#same').frame().find('#result').should('have.text', 'paid with 4242 4242')
  })

  it('types and clicks in a cross-origin iframe without cy.origin', () => {
    cy.get('#cross').frame().find('#origin').should('have.text', 'http://www.foobar.com:3500')
    cy.get('#cross').frame().find('#card').type('5555 4444').should('have.value', '5555 4444')
    cy.get('#cross').frame().contains('button', 'Pay').click()
    cy.get('#cross').frame().find('#result').should('have.text', 'paid with 5555 4444')
  })

  it('enters an iframe nested in a cross-origin iframe', () => {
    cy.get('#outer').frame().find('#label').should('have.text', 'outer')
    cy.get('#outer').frame().find('#inner').frame().find('#origin').should('have.text', 'http://localhost:3500')
    cy.get('#outer').frame().find('#inner').frame().find('#card').type('3782')
    cy.get('#outer').frame().find('#inner').frame().find('#pay').click()
    cy.get('#outer').frame().find('#inner').frame().find('#result').should('have.text', 'paid with 3782')
  })

  it('waits for an iframe that is added later', () => {
    cy.get('#add-late').click()
    cy.get('#late').frame().find('#label').should('have.text', 'late')
  })

  it('fails clearly when the subject is not an iframe', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include('Expected `#not-a-frame` to be an iframe, but found <p>, which is not an iframe.')
      done()
    })

    cy.get('#not-a-frame').frame().find('#card', { timeout: 500 }).should('exist')
  })
})

describe('legacy driver: iframes in the AUT', { experimentalRemoteDriver: false }, () => {
  beforeEach(() => {
    cy.visit(PAGE)
  })

  it('reaches a same-origin iframe only through its contentDocument', () => {
    cy.get('#same').its('0.contentDocument.body').find('#label').should('have.text', 'same-origin')
  })

  it('cannot reach a cross-origin iframe', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include('contentDocument')
      done()
    })

    cy.get('#cross').its('0.contentDocument.body', { timeout: 500 })
  })

  it('.frame() requires experimentalRemoteDriver', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include('`cy.frame()` requires `experimentalRemoteDriver` to be enabled.')
      done()
    })

    cy.get('#cross').frame()
  })
})

export {}
