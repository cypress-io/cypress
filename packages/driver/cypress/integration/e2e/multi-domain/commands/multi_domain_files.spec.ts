// @ts-ignore / session support is needed for visiting about:blank between tests
context('multi-domain files', { experimentalSessionSupport: true }, () => {
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

  it('.writeFile()', () => {
    cy.switchToDomain('foobar.com', () => {
      const contents = JSON.stringify({ foo: 'bar' })

      cy.stub(Cypress, 'backend').resolves({
        contents,
        filePath: 'foo.json',
      })

      cy.writeFile('foo.json', contents).then(() => {
        expect(Cypress.backend).to.be.calledWith(
          'write:file',
          'foo.json',
          contents,
          {
            encoding: 'utf8',
            flag: 'w',
          },
        )
      })
    })
  })
})
