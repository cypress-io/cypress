import RecordPromptVue from './RecordPrompt.vue'

describe('RecordPrompt', () => {
  it('renders with no props', () => {
    cy.mount(<RecordPromptVue />)

    cy.findByDisplayValue('npx cypress run --record --key <record-key>').should('be.visible')
  })

  it('renders with component testing type', () => {
    cy.mount(<RecordPromptVue currentTestingType="component" />)

    cy.findByDisplayValue('npx cypress run --component --record --key <record-key>').should('be.visible')
  })

  it('renders with Record Key', () => {
    cy.mount(<RecordPromptVue recordKey="abc-123" />)

    cy.findByDisplayValue('npx cypress run --record --key abc-123').should('be.visible')
  })

  it('renders with Record Key for component testing', () => {
    cy.mount(<RecordPromptVue currentTestingType="component" recordKey="abc-123" />)

    cy.findByDisplayValue('npx cypress run --component --record --key abc-123').should('be.visible')
  })
})
