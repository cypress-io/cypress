import Alert from './Alert.vue'

const alertTypes = ['default', 'error', 'warning', 'success', 'info'] as const

describe('<Alert />', { viewportHeight: 1500 }, () => {
  it('shows title only', () => {
    cy.mount(() => (
      <div class="flex flex-col p-4 gap-16px">
        <Alert type="success">Success</Alert>
        <Alert type="warning">Warning</Alert>
        <Alert type="error">Lorem ipsum dolor sit amet,
        consectetur adipiscing elit, sed do eiusmod tempor
        incididunt ut labore et dolore magna aliqua. Ut enim ad
        minim veniam, quis nostrud exercitation ullamco laboris nisi
        ut aliquip ex ea commodo consequat. Duis aute irure dolor
        in reprehenderit in voluptate velit esse cillum dolore eu
        fugiat nulla pariatur. Excepteur sint occaecat cupidatat
        non proident, sunt in culpa qui officia deserunt mollit
        anim id est laborum.</Alert>
        <Alert type="info"> Info</Alert>
        <Alert type="default">Default</Alert>

      </div>
    ))
  })

  it('shows title with details', () => {
    cy.mount(() => (
      <div class="flex flex-col p-4 gap-16px">
        {alertTypes.map((type) => (<Alert type={type} v-slots={{
          default: type,
          details: () => (<div>
            Lorem ipsum dolor sit amet,
            consectetur adipiscing elit, sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Ut enim ad
            minim veniam, quis nostrud exercitation ullamco laboris nisi
            ut aliquip ex ea commodo consequat. Duis aute irure dolor
            in reprehenderit in voluptate velit esse cillum dolore eu
            fugiat nulla pariatur. Excepteur sint occaecat cupidatat
            non proident, sunt in culpa qui officia deserunt mollit
            anim id est laborum.
          </div>),
        }} />))}
      </div>
    ))
  })

  it('shows errors with title, details & stack', () => {
  })
})
