import { mount } from '@cypress/vue'
import SpecPatternGuide from '@packages/runner-shared/src/components/SpecPatternGuide.vue'

describe('SpecPatternGuide', () => {
  it('filters using globby via web socket', () => {
    mount(SpecPatternGuide, {
      props: {
        runnerType: 'e2e',
        configFile: 'cypress.config.js',
      },
    })

    // cypress/fixtures/foo.spec.ts
    cy.get('input').clear().type('**/*fixtures/*.spec.ts')
    cy.get('[data-cy=file]').should('have.length', 1)
    cy.get('[data-cy=file]').contains('cypress/fixtures/foo.spec.ts')

    // cypress/fixtures/foo.spec.jsx
    // cypress/fixtures/foo.spec.ts
    cy.get('input').clear().type('**/*fixtures/*.spec.{{}j,t{}}s?(x)')
    cy.get('[data-cy=file]').should('have.length', 2)
    cy.get('[data-cy=file]').contains('cypress/fixtures/foo.spec.ts')
    cy.get('[data-cy=file]').contains('cypress/fixtures/foo.spec.jsx')

    // cypress/fixtures/__tests__/blah.test.js
    cy.get('input').clear().type('**/*__tests__/**/*')
    cy.get('[data-cy=file]').should('have.length', 1)
    cy.get('[data-cy=file]').contains('cypress/fixtures/__tests__/blah.test.js')
  })
})
