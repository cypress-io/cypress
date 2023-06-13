import SidebarNavigationHeader from './SidebarNavigationHeader.vue'
import { SidebarNavigationHeaderFragmentDoc } from '../generated/graphql-test'

describe('SidebarNavigationHeader', () => {
  it('renders e2e icon', () => {
    cy.mountFragment(SidebarNavigationHeaderFragmentDoc, {
      render: (gql) => <div class="p-[16px]"><SidebarNavigationHeader gql={gql} isNavBarExpanded /></div>,
    })

    cy.get('[data-cy="testing-type-e2e"]').should('exist')
    cy.contains('test-project')
  })

  it('renders component icon', () => {
    cy.mountFragment(SidebarNavigationHeaderFragmentDoc, {
      onResult: (res) => {
        if (!res || !res.currentProject) {
          return
        }

        res.currentProject.currentTestingType = 'component'
      },
      render: (gql) => <div class="p-[16px]"><SidebarNavigationHeader gql={gql} isNavBarExpanded /></div>,
    })

    cy.get('[data-cy="testing-type-component"]').should('exist')
    cy.contains('test-project')
  })
})
