import TestingTypeSwitcher from './TestingTypeSwitcher.vue'

describe('<TestingTypeSwitcher />', () => {
  beforeEach(() => {
    const stub = cy.stub().as('selectTestingType')

    cy.mount(<TestingTypeSwitcher
      viewedTestingType="e2e"
      isCtConfigured
      isE2eConfigured={false}
      onSelectTestingType={stub}
    />)
  })

  it('renders', () => {
    cy.percySnapshot()
  })

  it('displays question mark for unconfigured testing type', () => {
    cy.findByTestId('unconfigured-icon').should('be.visible')
  })

  it('emits event on switch', () => {
    cy.viewport(1200, 700)
    cy.findByText('Component specs').click()
    cy.get('@selectTestingType').should('have.been.calledOnceWith', 'component')
  })

  it('selects current testing type when it is e2e', () => {
    const stub = cy.stub().as('selectTestingType')

    cy.mount(<TestingTypeSwitcher
      viewedTestingType="e2e"
      isCtConfigured
      isE2eConfigured={true}
      onSelectTestingType={stub}
    />)

    cy.findByTestId('testing-type-switch').contains('button', 'E2E').should('have.attr', 'aria-selected', 'true')
    cy.findByTestId('testing-type-switch').contains('button', 'Component').should('have.attr', 'aria-selected', 'false')
  })

  it('selects current testing type when it is component', () => {
    const stub = cy.stub().as('selectTestingType')

    cy.mount(<TestingTypeSwitcher
      viewedTestingType="component"
      isCtConfigured
      isE2eConfigured={false}
      onSelectTestingType={stub}
    />)

    cy.findByTestId('testing-type-switch').contains('button', 'E2E').should('have.attr', 'aria-selected', 'false')
    cy.findByTestId('testing-type-switch').contains('button', 'Component').should('have.attr', 'aria-selected', 'true')
  })
})
