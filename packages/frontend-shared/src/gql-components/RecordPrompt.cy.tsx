import RecordPromptVue from './RecordPrompt.vue'

describe('RecordPrompt', () => {
  it('renders with no props', () => {
    cy.mount(<RecordPromptVue />)

    cy.get('[data-cy="terminal-prompt-input"]').should('have.value', 'npx cypress run --record --key <record-key>')
  })

  it('renders with component testing type', () => {
    cy.mount(<RecordPromptVue currentTestingType="component" />)

    cy.get('[data-cy="terminal-prompt-input"]').should('have.value', 'npx cypress run --component --record --key <record-key>')
  })

  it('renders with record key', () => {
    cy.mount(<RecordPromptVue recordKey="abc-123" />)

    cy.get('[data-cy="terminal-prompt-input"]').should('have.value', 'npx cypress run --record --key abc-123')
  })

  it('renders with record key for component testing', () => {
    cy.mount(<RecordPromptVue currentTestingType="component" recordKey="abc-123" />)

    cy.get('[data-cy="terminal-prompt-input"]').should('have.value', 'npx cypress run --component --record --key abc-123')
  })
})
