import type { CloudProjectResult } from '@packages/frontend-shared/cypress/support/generated/test-graphql-types.gen'
import { RecordKeySettingsFragmentDoc } from '../../generated/graphql-test'
import RecordKeySettings from './RecordKeySettings.vue'

describe('<RecordKeySettings />', () => {
  const key = '1234-bbbb-5678-dddd'

  function mountKeys (options: {
    recordKeys?: {id: string, key: string}[]
     cloudProject?: CloudProjectResult
    }) {
    const { recordKeys } = options

    cy.mountFragment(RecordKeySettingsFragmentDoc, {
      onResult: (res) => {
        if (recordKeys && res?.currentProject?.cloudProject?.__typename === 'CloudProject') {
          res.currentProject.cloudProject.recordKeys = recordKeys
        }
      },
      render: (gql) => (
        <div class="py-4 px-8">
          <RecordKeySettings gql={gql} />
        </div>
      ),
    })
  }

  it('empty', () => {
    mountKeys({ recordKeys: [] })
  })

  it('single key', () => {
    mountKeys({ recordKeys: [{ key, id: '1' }] })
  })

  it('multiple keys', () => {
    mountKeys({ recordKeys: [
      { key, id: '2' },
      { key, id: '3' },
    ] })
  })
})
