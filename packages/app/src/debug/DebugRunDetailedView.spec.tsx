import DebugRunDetailedView from './DebugRunDetailedView.vue'
import gqlData from './gql-DebugRunDetailedView.json'

describe('<DebugRunDetailedView />', () => {
  it('renders', () => {
    cy.mount(<DebugRunDetailedView gql={gqlData} />)
  })
})