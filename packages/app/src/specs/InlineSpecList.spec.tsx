import { Specs_InlineSpecListFragmentDoc } from '../generated/graphql-test'
import InlineSpecList from './InlineSpecList.vue'

let specs: Array<any> = []

describe('InlineSpecList', () => {
  beforeEach(() => {
    cy.mountFragment(Specs_InlineSpecListFragmentDoc, {
      onResult: (ctx) => {
        specs = ctx.specs?.edges || []

        return ctx
      },
      render: (gqlValue) => {
        return (
          <div data-cy='test-wrapper'>
            <div id="unified-runner-vue-wrapper">
              <div id="focus-tests-vue-teleport-target"></div>
            </div>
            <div class="bg-gray-1000">
              <InlineSpecList gql={gqlValue}></InlineSpecList>
            </div>
          </div>
        )
      },
    })
  })

  it('should render a list of specs', () => {
    cy.get('a').should('exist').and('have.length', specs.length)
  })

  it('can be opened/closed with an external button if teleport target exists', () => {
    // selecting with an ID as this is what associates the button with what it controls
    const specListSelector = '[id=inline-spec-list-aria-id]'

    cy.get(specListSelector).should('be.visible')
    cy.contains('button', 'Specs').click()
    cy.get(specListSelector).should('not.exist')
    cy.contains('button', 'Specs').click()

    // extra checks here to make sure the component correct remounts the teleport
    // after the toggle button is removed and readded
    // as though it was in a part of the DOM that re-rendered
    cy.get(specListSelector).should('be.visible').then(() => {
      document.querySelector('#focus-tests-vue-teleport-target')?.remove()
    })

    cy.contains('button', 'Specs').should('not.exist').then(() => {
      const target = document.createElement('div')

      target.id = 'focus-tests-vue-teleport-target'
      document.querySelector('#unified-runner-vue-wrapper')?.appendChild(target)
    })

    cy.contains('button', 'Specs').click()
    cy.get(specListSelector).should('not.exist')

    cy.contains('button', 'Specs').click()
    cy.get(specListSelector).should('be.visible')
  })
})
