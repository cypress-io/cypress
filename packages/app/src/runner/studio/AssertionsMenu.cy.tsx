import AssertionsMenu from './AssertionsMenu.ce.vue'
import AssertionType from './AssertionType.ce.vue'
import AssertionOptions from './AssertionOptions.ce.vue'
import type { PossibleAssertions, AddAssertion } from './types'

import './assertions-style.scss'

// Add styles to the document
const styleElement = document.createElement('style')

styleElement.textContent = `${AssertionsMenu.styles}\n${AssertionType.styles}\n${AssertionOptions.styles}`
document.head.appendChild(styleElement)

describe('AssertionsMenu', () => {
  const mockPossibleAssertions: PossibleAssertions = [
    {
      type: 'have.text',
      options: [
        { name: 'text', value: 'Hello World' },
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
    const $el = Cypress.$('<div>').appendTo('body')

    defaultProps = {
      jqueryElement: $el,
      possibleAssertions: mockPossibleAssertions,
      addAssertion: mockAddAssertion,
      closeMenu: mockCloseMenu,
    }

    cy.mount(AssertionsMenu, {
      props: defaultProps,
    })
  })

  it('renders the menu with correct title and tag name', () => {
    cy.get('[data-cy="assertions-menu-header"]').should('be.visible')
    cy.get('[data-cy="assertions-menu-header"]').should('contain', 'Assert')
  })

  // it('calls addAssertion when clicking a single assertion', () => {
  //   cy.get('.assertion-type.single-assertion').click()
  //   cy.wrap(mockAddAssertion).should('have.been.calledWith', Cypress.$('div'), 'be.visible')
  // })

  // it('calls closeMenu when clicking the close button', () => {
  //   cy.get('.assertions-menu__close').click()
  //   cy.wrap(mockCloseMenu).should('have.been.called')
  // })
})
