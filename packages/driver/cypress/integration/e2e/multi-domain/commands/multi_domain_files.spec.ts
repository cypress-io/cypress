// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain files', { experimentalSessionSupport: true, experimentalMultiDomain: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="multi-domain-secondary-link"]').click()
  })

  it('.fixture()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.fixture('example.json').then((json) => {
        expect(json).to.be.an('object')
        expect(json.example).to.be.true
      })
    })
  })

  it('.readFile()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.readFile('cypress/fixtures/example.json').then((json) => {
        expect(json).to.be.an('object')
        expect(json.example).to.be.true
      })
    })
  })

  // FIXME: stub on Cypress.backend is causing an infinite loop
  it.skip('.writeFile()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.stub(Cypress, 'backend')
      // @ts-ignore
      Cypress.backend.resolves({
        contents: JSON.stringify({ foo: 'bar' }),
        filePath: 'foo.json',
      })

      cy.writeFile('foo.json', JSON.stringify({ foo: 'bar' })).then(() => {
        expect(Cypress.backend).to.be.calledWith(
          'write:file',
          'foo.json',
          JSON.stringify({ foo: 'bar' }),
          {
            encoding: 'utf8',
            flag: 'w',
          },
        )
      })
    })
  })
})
