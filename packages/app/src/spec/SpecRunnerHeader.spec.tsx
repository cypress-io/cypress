import SpecRunnerHeader from './SpecRunnerHeader.vue'
import { useAutStore } from '../store'
import { SpecRunnerHeaderFragmentDoc } from '../generated/graphql-test'

describe('SpecRunnerHeader', () => {
  it('renders', () => {
    const autStore = useAutStore()
    autStore.updateUrl('http://localhost:4000')
    cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
      render: (gqlVal) => {
        return <SpecRunnerHeader gql={gqlVal} />
      }
    })
  })
})
