describe('plugin', () => {
  describe('excludeSpecPattern', () => {
    it('supports an array value', () => {
      cy.task('grep', {
        excludeSpecPattern: ['**/test2.cy.ts', '**/test3.cy.ts'],
        specPattern: '**/*.cy.ts',
        expose: {
          grepTags: 'smoke',
          grepFilterSpecs: true,
        },
      }).then((config: Cypress.Config) => {
        expect(config.specPattern.length).to.equal(1)
        expect(config.specPattern[0]).to.contain('test1.cy.ts')
      })
    })

    it('supports a string value', () => {
      cy.task('grep', {
        excludeSpecPattern: '**/test2.cy.ts',
        specPattern: '**/*.cy.ts',
        expose: {
          grepTags: 'smoke',
          grepFilterSpecs: true,
        },
      }).then((config: Cypress.Config) => {
        expect(config.specPattern.length).to.equal(2)
        expect(config.specPattern[0]).to.contain('test1.cy.ts')
        expect(config.specPattern[1]).to.contain('test3.cy.ts')
      })
    })
  })
})
