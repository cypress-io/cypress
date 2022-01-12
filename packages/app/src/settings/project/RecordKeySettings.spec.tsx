import { defaultMessages } from '@cy/i18n'
import { createCloudRecordKey, createCloudUser } from '@packages/frontend-shared/cypress/support/mock-graphql/stubgql-CloudTypes'
import { RecordKeySettingsFragmentDoc } from '../../generated/graphql-test'
import RecordKeySettings from './RecordKeySettings.vue'

describe('<RecordKeySettings />', () => {
  const key = '1234-bbbb-5678-dddd'

  function mountKeysSection (options?: {
    recordKeys?: {id: string, key?: string}[]
     cloudProject?: any
    }) {
    const { recordKeys, cloudProject } = options || {}

    cy.mountFragment(RecordKeySettingsFragmentDoc, {
      onResult: (res) => {
        res.cloudViewer = { ...createCloudUser({ userIsViewer: true }), organizations: { nodes: [] }, organizationControl: null }

        if (res.currentProject?.cloudProject?.__typename === 'CloudProject' && recordKeys) {
          const recordKeyWithTypes = recordKeys.map((k, i) => createCloudRecordKey({ key: `${key}-${i}`, ...k }))

          res.currentProject.cloudProject.recordKeys = recordKeyWithTypes
        }

        if (cloudProject && res.currentProject) {
          res.currentProject.cloudProject = cloudProject
        }
      },
      render: (gql) => (
        <div class="py-4 px-8">
          <RecordKeySettings gql={gql} />
        </div>
      ),
    })
  }

  context('normal', () => {
    it('renders section correct title', () => {
      mountKeysSection({ recordKeys: [] })
      cy.findByText(defaultMessages.settingsPage.recordKey.title)
    })

    it('single key', () => {
      mountKeysSection({ recordKeys: [{ id: '1' }] })
      cy.get('[aria-label="Record Key Visibility Toggle"]').click()
    })

    it('multiple keys', () => {
      mountKeysSection({
        recordKeys: [
          { id: '2' },
          { id: '3' },
          { id: '4' },
        ],
      })
    })
  })

  context('errors', () => {
    it('empty', () => {
      mountKeysSection({ recordKeys: [] })
      cy.findByText(defaultMessages.settingsPage.recordKey.errorEmpty)
    })

    it('Project not found', () => {
      mountKeysSection({
        cloudProject: {
          __typename: 'CloudProjectNotFound',
        },
      })

      cy.findByText(defaultMessages.settingsPage.recordKey.errorNotFound)
      cy.findByText(defaultMessages.settingsPage.recordKey.errorNotFoundButton).click()
    })

    it('Project not authorized', () => {
      mountKeysSection({
        cloudProject: {
          __typename: 'CloudProjectUnauthorized',
          hasRequestedAccess: false,
        },
      })

      cy.findByText(defaultMessages.settingsPage.recordKey.errorAccess)
      cy.findByText(defaultMessages.settingsPage.recordKey.errorAccessButton).click()
    })

    it('Project not authorized and requested', () => {
      mountKeysSection({
        cloudProject: {
          __typename: 'CloudProjectUnauthorized',
          hasRequestedAccess: true,
        },
      })

      cy.findByText(defaultMessages.settingsPage.recordKey.errorAccessPending)
    })
  })
})
