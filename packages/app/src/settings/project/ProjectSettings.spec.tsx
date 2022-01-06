import { defaultMessages } from '@cy/i18n'
import { createCloudUser } from '@packages/frontend-shared/cypress/support/mock-graphql/stubgql-CloudTypes'
import { ProjectSettingsFragmentDoc } from '../../generated/graphql-test'
import ProjectSettings from './ProjectSettings.vue'

describe('<ProjectSettings />', { viewportWidth: 1024 }, () => {
  it('displays the project, record key, and experiments sections', () => {
    cy.mountFragment(ProjectSettingsFragmentDoc, {
      onResult (ctx) {
        if (ctx.currentProject?.cloudProject?.__typename === 'CloudProject') {
          ctx.currentProject.cloudProject.recordKeys = []
        }
      },
      render: (gqlVal) => {
        return (
          <div class="py-4 px-8 children:py-24px">
            <ProjectSettings gql={gqlVal}/>
          </div>
        )
      },
    })

    cy.findByText('Project ID').should('be.visible')
    cy.findByText(defaultMessages.settingsPage.recordKey.errorEmpty)
    cy.findByText('Experiments').should('be.visible')
  })

  it('displays an error when project is not found', () => {
    cy.mountFragment(ProjectSettingsFragmentDoc, {
      onResult (ctx) {
        ctx.cloudViewer = {
          ...createCloudUser({ userIsViewer: true }),
          organizations: { nodes: [] },
          organizationControl: null,
        }

        if (ctx.currentProject) {
          ctx.currentProject.cloudProject = {
            __typename: 'CloudProjectNotFound',
          }
        }
      },
      render: (gqlVal) => {
        return (
          <div class="py-4 px-8 children:py-24px">
            <ProjectSettings gql={gqlVal}/>
          </div>
        )
      },
    })

    cy.findByText(defaultMessages.settingsPage.recordKey.errorNotFound)
  })

  it('displays an error when project is not accessible', () => {
    cy.mountFragment(ProjectSettingsFragmentDoc, {
      onResult (ctx) {
        ctx.cloudViewer = {
          ...createCloudUser({ userIsViewer: true }),
          organizations: { nodes: [] },
          organizationControl: null,
        }

        if (ctx.currentProject) {
          ctx.currentProject.cloudProject = {
            __typename: 'CloudProjectUnauthorized',
            hasRequestedAccess: false,
          }
        }
      },
      render: (gqlVal) => {
        return (
          <div class="py-4 px-8 children:py-24px">
            <ProjectSettings gql={gqlVal}/>
          </div>
        )
      },
    })

    cy.findByText(defaultMessages.settingsPage.recordKey.errorAccess)
  })
})
