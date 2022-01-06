import { defaultMessages } from '@cy/i18n'
import { createCloudRecordKey } from '@packages/frontend-shared/cypress/support/mock-graphql/stubgql-CloudTypes'
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

  describe('normal behavior', () => {
    it('renders the record key view with the correct title', () => {
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
        ] })
    })
  })

  describe('errors', () => {
    it('empty', () => {
      mountKeysSection({ recordKeys: [] })
      cy.findByText(defaultMessages.settingsPage.recordKey.errorEmpty)
    })
  })
})
