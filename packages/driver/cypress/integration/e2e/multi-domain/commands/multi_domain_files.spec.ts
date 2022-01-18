// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain files', { experimentalSessionSupport: true, experimentalMultiDomain: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="multi-domain-secondary-link"]').click()
    cy.stub(Cypress, 'backend').callThrough()
  })

  // FIXME: CypressError: `cy.fixture()` timed out waiting `undefinedms` to receive a fixture. No fixture was ever sent by the server.
  // at eval (webpack:///../driver/src/cy/commands/fixtures.ts?:89:85)
  it.skip('.fixture()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.fixture('example.json').then((json) => {
        expect(json).to.be.an('object')
        expect(json.example).to.be.true
      })
    })
  })

  // FIXME: CypressError: `cy.readFile("cypress/fixtures/multi-domain.json")` timed out after waiting `undefinedms`.
  // at eval (webpack:///../driver/src/cy/commands/files.ts?:59:89)
  it.skip('.readFile()', () => {
    cy.switchToDomain('foobar.com', () => {
      cy.readFile('cypress/fixtures/example.json').then((json) => {
        expect(json).to.be.an('object')
        expect(json.example).to.be.true
      })
    })
  })

  // FIXME: Cypress.backend.resolves is not a function
  // Works when not using switchToDomain
  it.skip('.writeFile()', () => {
    cy.switchToDomain('foobar.com', () => {
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
