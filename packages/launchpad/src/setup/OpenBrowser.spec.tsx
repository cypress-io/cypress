import browsers from '../../cypress/fixtures/browsers.json'
import OpenBrowser from './OpenBrowser.vue'

describe('<OpenBrowser />', () => {
  it('renders', () => {
    cy.mount(() => <OpenBrowser app={{ browsers }}/>)
  })
})
