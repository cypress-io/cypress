import ProxySettings from './ProxySettings.vue'

describe('<ProxySettings />', () => {
  it('renders', () => {
    cy.viewport(400, 400)
    .mount(() => <ProxySettings />).get('body')
    .findByText('Proxy Server').get('body')
    .findByText('Proxy Bypass List')
    .get('[data-testid=bypass-list]').should('be.visible')
    .get('[data-testid=proxy-server]').should('be.visible')
  })
})
