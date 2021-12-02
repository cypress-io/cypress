import Alert from './Alert.vue'

describe('<Alert />', { viewportHeight: 1500 }, () => {
  it('title only', () => {
    cy.mount(() => (
      <div class="p-4 flex flex-col gap-16px">
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

  it('title with details', () => {
    cy.mount(() => (
      <div class="p-4 flex flex-col gap-16px">
        <Alert type="success" v-slots={{
          default: 'Success',
          details: () => (<div class="p-16px">Lorem ipsum dolor sit amet,
          consectetur adipiscing elit, sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi
          ut aliquip ex ea commodo consequat. Duis aute irure dolor
          in reprehenderit in voluptate velit esse cillum dolore eu
          fugiat nulla pariatur. Excepteur sint occaecat cupidatat
          non proident, sunt in culpa qui officia deserunt mollit
          anim id est laborum.</div>),
        }} />
        <Alert type="error" v-slots={{
          default: 'Error',
          details: () => (<div class="p-16px">Lorem ipsum dolor sit amet,
          consectetur adipiscing elit, sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi
          ut aliquip ex ea commodo consequat. Duis aute irure dolor
          in reprehenderit in voluptate velit esse cillum dolore eu
          fugiat nulla pariatur. Excepteur sint occaecat cupidatat
          non proident, sunt in culpa qui officia deserunt mollit
          anim id est laborum.</div>),
        }} />
        <Alert type="info" v-slots={{
          default: 'Info',
          details: () => (<div class="p-16px">Lorem ipsum dolor sit amet,
          consectetur adipiscing elit, sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi
          ut aliquip ex ea commodo consequat. Duis aute irure dolor
          in reprehenderit in voluptate velit esse cillum dolore eu
          fugiat nulla pariatur. Excepteur sint occaecat cupidatat
          non proident, sunt in culpa qui officia deserunt mollit
          anim id est laborum.</div>),
        }} />
        <Alert type="default" v-slots={{
          default: 'Default',
          details: () => (<div class="p-16px">Lorem ipsum dolor sit amet,
          consectetur adipiscing elit, sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi
          ut aliquip ex ea commodo consequat. Duis aute irure dolor
          in reprehenderit in voluptate velit esse cillum dolore eu
          fugiat nulla pariatur. Excepteur sint occaecat cupidatat
          non proident, sunt in culpa qui officia deserunt mollit
          anim id est laborum.</div>),
        }} />
      </div>
    ))
  })
})
