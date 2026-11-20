import AssertionsMenu from './AssertionsMenu.ce.vue'
import AssertionType from './AssertionType.ce.vue'
import AssertionOptions from './AssertionOptions.ce.vue'
import type { PossibleAssertions, AddAssertion } from './types'

// Add styles to the document
const styleElement = document.createElement('style')

styleElement.textContent = `${AssertionsMenu.styles}\n${AssertionType.styles}\n${AssertionOptions.styles}`
document.head.appendChild(styleElement)

describe('AssertionsMenu', () => {
  const mockPossibleAssertions: PossibleAssertions = [
    {
      type: 'have.text',
      options: [
        { value: 'Test Element' },
      ],
    },
    {
      type: 'have.attr',
      options: [
        { name: 'aria-label', value: 'Hello World' },
        { name: 'name', value: 'foo' },
        { name: 'id', value: 'bar' },
      ],
    },
    {
      type: 'be.visible',
      options: [],
    },
  ]

  let mockAddAssertion: AddAssertion
  let mockCloseMenu: () => void
  let defaultProps: any

  beforeEach(() => {
    mockAddAssertion = cy.stub()
    mockCloseMenu = cy.stub()

    // Create a real jQuery element
    const $el = Cypress.$('<div class="test-element">Test Element</div>').appendTo('body')

    defaultProps = {
      jqueryElement: $el,
      possibleAssertions: mockPossibleAssertions,
      addAssertion: mockAddAssertion,
      closeMenu: mockCloseMenu,
    }

    cy.viewport(500, 500)

    cy.mount(AssertionsMenu, {
      props: defaultProps,
    })
  })

  it('renders the menu with correct title and tag name', () => {
    cy.get('[data-cy="assertions-menu-header"]')
    .should('be.visible')
    .and('contain', 'Assert')

    cy.get('[data-cy="assertions-subtitle"]')
    .should('be.visible')
    .and('contain', 'Expect')
    .and('contain', 'div')
  })

  it('is tabbable', () => {
    cy.get('[data-cy="assertion-options"]').should('not.exist')
    cy.press('Tab') // close
    cy.get('[data-cy="assertions-menu-close"]').should('be.focused')
    cy.press('Tab') // first assertion type
    cy.press('Tab') // first assertion option
    cy.get('[data-cy="assertion-options"]').should('contain', 'Test Element')
  })

  it('calls addAssertion when clicking a single assertion', () => {
    cy.get('.assertion-type.single-assertion').click()
    cy.wrap(mockAddAssertion).should('have.been.calledWith', Cypress.sinon.match.any, 'be.visible')
  })

  it('calls closeMenu when clicking the close button', () => {
    cy.get('[data-cy="assertions-menu-close"]').click()
    cy.wrap(mockCloseMenu).should('have.been.called')
  })
})
