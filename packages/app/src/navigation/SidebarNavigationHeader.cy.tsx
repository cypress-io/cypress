import SidebarNavigationHeader from './SidebarNavigationHeader.vue'
import { SidebarNavigationHeaderFragmentDoc } from '../generated/graphql-test'

describe('SidebarNavigationHeader', () => {
  it('renders e2e icon', () => {
    cy.mountFragment(SidebarNavigationHeaderFragmentDoc, {
      render: (gql) => <div class="p-16px"><SidebarNavigationHeader gql={gql} isNavBarExpanded /></div>,
    })

    cy.get('[data-cy="testing-type-e2e"]').should('exist')
    cy.contains('test-project')
    cy.percySnapshot()
  })

  it('renders component icon', () => {
    cy.mountFragment(SidebarNavigationHeaderFragmentDoc, {
      onResult: (res) => {
        if (!res || !res.currentProject) {
          return
        }

        res.currentProject.currentTestingType = 'component'
      },
      render: (gql) => <div class="p-16px"><SidebarNavigationHeader gql={gql} isNavBarExpanded /></div>,
    })

    cy.get('[data-cy="testing-type-component"]').should('exist')
    cy.contains('test-project')
    cy.percySnapshot()
  })

  describe('rendering tooltip message', () => {
    it('nav expanded', () => {
      cy.mountFragment(SidebarNavigationHeaderFragmentDoc, {
        render: (gql) => <div style={{ width: '300px' }}><div class="p-16px"><SidebarNavigationHeader gql={gql} isNavBarExpanded /></div></div>,
      })

      cy.get('[data-cy="sidebar-header"]').realHover()
      cy.get('[data-cy="project-name-tooltip"]').should('not.exist')
      cy.get('[data-cy="switch-testing-tooltip"]').should('be.visible')

      cy.percySnapshot()
    })

    it('nav collapsed', () => {
      cy.mountFragment(SidebarNavigationHeaderFragmentDoc, {
        render: (gql) => <div style={{ width: '300px' }}><div class="p-16px"><SidebarNavigationHeader gql={gql} isNavBarExpanded={false} /></div></div>,
      })

      cy.get('[data-cy="sidebar-header"]').realHover()
      cy.get('[data-cy="project-name-tooltip"]').should('be.visible')
      cy.get('[data-cy="switch-testing-tooltip"]').should('be.visible')

      cy.percySnapshot()
    })
  })
})
