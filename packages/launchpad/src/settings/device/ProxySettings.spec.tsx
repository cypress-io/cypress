import ProxySettings from './ProxySettings.vue'

describe('<ProxySettings />', () => {
  it('renders', () => {
    cy.viewport(400, 400).mount(() => <ProxySettings />)
  })
})
