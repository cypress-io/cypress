import CompareTestingTypes from './CompareTestingTypes.vue'

const expectedContent = [
  'End-to-end tests',
  'Visit URLs via',
  'Test flows and functionality across multiple pages',
  'Ideal for testing integrated flows in CD workflows',
  'Component tests',
  'Import components via',
  'Test individual components of a design system in isolation',
  'Ideal for testing isolated flows and components in CI',
]

describe('TestingTypeCards', () => {
  it('renders expected content', () => {
    cy.mount(CompareTestingTypes)
    expectedContent.forEach((pieceOfText) =>
      cy.contains(pieceOfText).should('be.visible'))
  })
})
