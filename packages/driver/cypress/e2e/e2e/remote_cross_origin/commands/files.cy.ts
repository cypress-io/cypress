describe('remote driver: files in a cross-origin AUT', { experimentalRemoteDriver: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()
  })

  it('.fixture()', () => {
    cy.fixture('example.json').then((json) => {
      expect(json).to.be.an('object')
      expect(json.example).to.be.true
    })
  })

  it('.readFile()', () => {
    cy.readFile('cypress/fixtures/example.json').then((json) => {
      expect(json).to.be.an('object')
      expect(json.example).to.be.true
    })
  })

  it('.writeFile()', () => {
    const contents = JSON.stringify({ foo: 'bar' })

    cy.stub(Cypress, 'backend').log(false).callThrough().withArgs('run:privileged').resolves({
      contents,
      filePath: 'foo.json',
    })

    cy.writeFile('foo.json', contents).then(() => {
      expect(Cypress.backend).to.be.calledWith(
        'run:privileged',
        {
          commandName: 'writeFile',
          options: {
            fileName: 'foo.json',
            contents,
            encoding: 'utf8',
            flag: 'w',
          },
        },
      )
    })
  })
})
