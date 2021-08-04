import ProxySettings from './ProxySettings.vue'
import IconLaptop from 'virtual:vite-icons/mdi/laptop'

describe('<ProxySettings />', () => {
  it('renders', () => {
    cy.mount(() => <ProxySettings />)
  })
})
