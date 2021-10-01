import { HeaderBarFragmentDoc } from '../generated/graphql-test'
import HeaderBar from './HeaderBar.vue'

describe('<HeaderBar />', () => {
  it('renders with functional browser menu when show-browsers prop is true', () => {
    cy.viewport(1000, 750)
    cy.mountFragment(HeaderBarFragmentDoc, {
      type: (ctx) => {
        return {
          ...ctx.stubQuery,
        }
      },
      render: (gqlVal) => <div class="resize overflow-auto border-current border-1 h-700px"><HeaderBar gql={gqlVal} show-browsers={true} /></div>,
    })

    cy.contains('button', 'Electron v73')
    .should('be.visible')
    .click()

    cy.contains('Edge Canary')
    .should('be.visible')
  }),

  it('renders without browser menu by default and other items work', () => {
    cy.viewport(1000, 750)
    cy.mountFragment(HeaderBarFragmentDoc, {
      type: (ctx) => {
        return {
          ...ctx.stubQuery,
        }
      },
      render: (gqlVal) => <div class="resize overflow-auto border-current border-1 h-700px"><HeaderBar gql={gqlVal} /></div>,
    })

    cy.contains('button', 'Electron v73').should('not.exist')
    cy.contains('button', 'Docs').click()
    cy.contains('a', 'Write your first test').should('be.visible')
    cy.contains('button', 'v8.4.1').click()
    cy.contains('a', 'Write your first test').should('not.exist')
    cy.contains('a', 'See all releases').should('be.visible')
  })

  it('displays the active project name', () => {
    cy.viewport(1000, 750)
    cy.mountFragment(HeaderBarFragmentDoc, {
      type: (ctx) => {
        return {
          ...ctx.stubQuery,
        }
      },
      render: (gqlVal) => <div class="resize overflow-auto border-current border-1 h-700px"><HeaderBar gql={gqlVal} /></div>,
    })

    cy.contains('test-project').should('be.visible')
  })
})
