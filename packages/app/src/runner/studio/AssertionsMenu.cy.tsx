import AssertionsMenu from './AssertionsMenu.ce.vue'
import AssertionType from './AssertionType.ce.vue'
import AssertionOptions from './AssertionOptions.ce.vue'
import { openStudioAssertionsMenu, closeStudioAssertionsMenu } from './mounter'
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

const geometry = (doc: Document) => {
  return {
    width: doc.documentElement.scrollWidth,
    height: doc.documentElement.scrollHeight,
    viewportWidth: doc.documentElement.clientWidth,
    viewportHeight: doc.documentElement.clientHeight,
  }
}

describe('Studio assertion menu layout', () => {
  let initial: ReturnType<typeof geometry>
  let target: HTMLButtonElement
  let spacer: HTMLDivElement | undefined
  let addAssertion: ReturnType<typeof cy.stub>

  beforeEach(() => {
    spacer = undefined
    addAssertion = cy.stub()
    cy.viewport(300, 500)
    cy.document().then((doc) => {
      target = doc.createElement('button')
      target.textContent = 'synthetic target'
      Object.assign(target.style, { position: 'absolute', left: '180px', top: '60px' })
      doc.body.appendChild(target)
      initial = geometry(doc)
    })
  })

  afterEach(() => {
    cy.document().then((doc) => {
      closeStudioAssertionsMenu(Cypress.$(doc.body))
      target.remove()
      spacer?.remove()
    })
  })

  for (const { count, scrolled } of [{ count: 3, scrolled: false }, { count: 20, scrolled: false }, { count: 3, scrolled: true }]) {
    it(`preserves AUT layout and option selection with ${count} attributes${scrolled ? ' after scrolling' : ''}`, () => {
      if (scrolled) {
        cy.document().then((doc) => {
          spacer = doc.createElement('div')
          spacer.style.height = '1600px'
          doc.body.appendChild(spacer)
          target.style.top = '900px'
        })

        cy.scrollTo(0, 700)
        cy.document().then((doc) => {
          initial = geometry(doc)
        })
      }

      cy.document().then((doc) => {
        for (let n = 0; n < count; n++) {
          target.setAttribute(`data-attribute-${n}`, `value-${n}`)
        }

        openStudioAssertionsMenu({
          $el: Cypress.$(target),
          $body: Cypress.$(doc.body),
          props: {
            possibleAssertions: [{ type: 'have.attr', options: Array.from({ length: count }, (_, n) => ({ name: `data-attribute-${n}`, value: `value-${n}` })) }],
            addAssertion,
            closeMenu: () => closeStudioAssertionsMenu(Cypress.$(doc.body)),
          },
        })
      })

      cy.get('.__cypress-studio-assertions-menu').shadow().find('.highlight').should(($highlight) => {
        const actual = $highlight[0].getBoundingClientRect()
        const expected = target.getBoundingClientRect()

        for (const dimension of ['left', 'top', 'width', 'height'] as const) {
          expect(actual[dimension], `highlight ${dimension}`).to.be.closeTo(expected[dimension], 1)
        }
      })

      cy.get('.__cypress-studio-assertions-menu').shadow().find('.assertions-menu').should('have.attr', 'data-popper-placement')
      cy.get('.__cypress-studio-assertions-menu').shadow().find('.assertion-type').trigger('mouseover')
      cy.get('.__cypress-studio-assertions-menu').shadow().find('[data-cy=assertion-options]').should('have.attr', 'data-popper-placement')
      cy.document().should((doc) => {
        expect(geometry(doc), 'document and viewport geometry').to.deep.equal(initial)
      })

      cy.get('.__cypress-studio-assertions-menu').shadow().find('[data-cy=assertion-options]').should(($options) => {
        const el = $options[0]
        const rect = el.getBoundingClientRect()
        const win = el.ownerDocument.defaultView!

        expect(rect.left, 'options left edge').to.be.at.least(0)
        expect(rect.right, 'options right edge').to.be.at.most(win.innerWidth)
        expect(rect.bottom, 'options bottom edge').to.be.at.most(win.innerHeight)
      })

      cy.get('.__cypress-studio-assertions-menu').shadow().find('[data-cy=assertion-option]').last().scrollIntoView().click()
      cy.wrap(addAssertion).should('have.been.calledWith', Cypress.sinon.match.any, 'have.attr', `data-attribute-${count - 1}`, `value-${count - 1}`)
      cy.document().should((doc) => {
        expect(geometry(doc), 'geometry after selecting the last option').to.deep.equal(initial)
      })
    })
  }
})
