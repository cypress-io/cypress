import DeviceSettings from './DeviceSettings.vue'
import IconLaptop from 'virtual:vite-icons/mdi/laptop'

describe('<DeviceSettingsPage />', () => {
  it('renders', () => {
    cy.mount(() => <DeviceSettings />)
  })
})
