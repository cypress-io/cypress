import RecordPromptVue from './RecordPrompt.vue'

describe('RecordPrompt', () => {
  it('renders with no props', () => {
    cy.mount(<RecordPromptVue />)

    cy.findByText('npx cypress run --record --key <record-key>').should('be.visible')
  })

  it('renders with component testing type', () => {
    cy.mount(<RecordPromptVue currentTestingType="component" />)

    cy.findByText('npx cypress run --component --record --key <record-key>').should('be.visible')
  })

  it('renders with record key', () => {
    cy.mount(<RecordPromptVue recordKey="abc-123" />)

    cy.findByText('npx cypress run --record --key abc-123').should('be.visible')
  })

  it('renders with record key for component testing', () => {
    cy.mount(<RecordPromptVue currentTestingType="component" recordKey="abc-123" />)

    cy.findByText('npx cypress run --component --record --key abc-123').should('be.visible')
  })
})
