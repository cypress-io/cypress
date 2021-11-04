import DeviceSettings from './DeviceSettings.vue'

describe('<DeviceSettingsPage />', () => {
  it('renders', () => {
    cy.mount(() => <DeviceSettings />)
  })
})
