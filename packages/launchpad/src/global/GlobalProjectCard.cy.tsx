import GlobalProjectCard from './GlobalProjectCard.vue'
import { GlobalProjectCardFragmentDoc } from '../generated/graphql-test'
// tslint:disable-next-line: no-implicit-dependencies - need to handle this
import { defaultMessages } from '@cy/i18n'

const defaultPath = '/usr/local/dev/projects/some-test-title'
const menuSelector = '[data-cy=project-card-menu-items]'
const projectCardSelector = '[data-cy=project-card]'

describe('<GlobalProjectCard />', () => {
  beforeEach(() => {
    const removeProjectSpy = cy.spy().as('removeProjectSpy')
    const openInFinderSpy = cy.spy().as('openInFinderSpy')
    const openInIDESpy = cy.spy().as('openInIDESpy')
    const setCurrentProjectSpy = cy.spy().as('setCurrentProjectSpy')

    cy.mountFragment(GlobalProjectCardFragmentDoc, {
      render: (gqlValue) => (
        <div class="p-12 overflow-auto resize-x max-w-[600px]">
          <GlobalProjectCard gql={gqlValue}
            onOpenInIDE={openInIDESpy}
            onOpenInFinder={openInFinderSpy}
            onRemoveProject={removeProjectSpy}
            on_setCurrentProject={setCurrentProjectSpy} />
        </div>
      ),
    })

    cy.findByLabelText(defaultMessages.globalPage.projectActions, { selector: 'button' })
    .as('openMenuButton')
  })

  it('renders', () => {
    cy.findByText('some-test-title').should('be.visible')
    cy.findByText(defaultPath).should('be.visible')
  })

  describe('Menu', () => {
    beforeEach(() => {
      cy.get('@openMenuButton')
      .click()
    })

    it('emits openInIDE with path value on click', () => {
      cy.contains(defaultMessages.globalPage.openInIDE)
      .click()
      .get('@openInIDESpy')
      .should('have.been.calledOnceWith', defaultPath)
      .get(menuSelector)
      .should('not.exist')
    })

    it('emits openInFinder with path value on click', () => {
      cy.contains(defaultMessages.globalPage.openInFinder)
      .click()
      .get('@openInFinderSpy')
      .should('have.been.calledOnceWith', defaultPath)
      .get(menuSelector)
      .should('not.exist')
    })

    it('emits removeProject with path value on click', () => {
      cy.contains(defaultMessages.globalPage.removeProject)
      .click()
      .get('@removeProjectSpy')
      .should('have.been.calledOnceWith', defaultPath)
      .get(menuSelector)
      .should('not.exist')
    })

    describe('dismiss', () => {
      it('opens project when card is clicked on while menu is open', () => {
        cy.get(projectCardSelector)
        .click()
        .get('@setCurrentProjectSpy')
        .should('have.been.calledOnceWith', defaultPath)
      })

      it('does not open project when menu button is clicked on while menu is open', () => {
        cy.get('@openMenuButton')
        .should('be.visible')
        .click()
        .get('@setCurrentProjectSpy')
        .should('not.have.been.called')
      })

      it('dismisses when escape is pressed', () => {
        cy.get('body').type('{esc}')
        .get(menuSelector)
        .should('not.exist')
      })

      it('dismisses when clicking off the menu', () => {
        cy.get('body')
        .click(0, 0)
        .get(menuSelector)
        .should('not.exist')
      })
    })
  })
})
