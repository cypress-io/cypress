import { ManualInstallFragmentDoc } from '../generated/graphql-test'
import ManualInstall from './ManualInstall.vue'
import { PACKAGES_DESCRIPTIONS } from '../../../types/src/constants'

describe('<ManualInstall />', () => {
  it('lists packages and can copy install command to clipboard', { viewportWidth: 800, viewportHeight: 600 }, () => {
    const framework = '@cypress/react'
    const bundler = '@cypress/webpack-dev-server'

    cy.mountFragment(ManualInstallFragmentDoc, {
      render: (gqlVal) => (
        <div class="rounded border-1 border-gray-400 m-10">
          <ManualInstall gql={gqlVal} />
        </div>
      ),
    })

    const installCommand = `yarn add -D ${framework} ${bundler}`

    // @ts-ignore
    cy.findByRole('button', { name: 'Copy' }).realClick()

    cy.findByRole('button', { name: 'Copied!' })

    if (Cypress.config('browser').name === 'chrome') {
      cy.wrap(Cypress.automation('remote:debugger:protocol', {
        command: 'Browser.grantPermissions',
        params: {
          permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
          origin: window.location.origin,
        },
      }))
    }

    cy.window().its('navigator.permissions')
    .invoke('query', { name: 'clipboard-read' })
    .its('state').then(cy.log)

    cy.window().its('navigator.clipboard')
    .invoke('readText')
    .should('equal', installCommand)

    const validatePackage = (packageName) => {
      cy.findByRole('link', { name: packageName })
      .should('have.attr', 'href', `https://www.npmjs.com/package/${packageName}`)

      cy.contains(PACKAGES_DESCRIPTIONS[framework].split('<span')[0])
    }

    validatePackage(framework)
    validatePackage(bundler)
  })
})
