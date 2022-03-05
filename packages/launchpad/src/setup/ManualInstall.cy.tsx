import { ManualInstallFragmentDoc } from '../generated/graphql-test'
import ManualInstall from './ManualInstall.vue'
import { CYPRESS_REACT_LATEST, CYPRESS_WEBPACK } from '@packages/scaffold-config'

describe('<ManualInstall />', () => {
  it('playground', () => {
    cy.mountFragment(ManualInstallFragmentDoc, {
      render: (gqlVal) => (
        <div class="rounded border-1 border-gray-400 m-10">
          <ManualInstall gql={gqlVal} packagesInstalled={[]}/>
        </div>
      ),
    })
  })

  it('lists packages and can copy install command to clipboard', { viewportWidth: 800, viewportHeight: 600 }, () => {
    const framework = CYPRESS_REACT_LATEST
    const bundler = CYPRESS_WEBPACK

    cy.mountFragment(ManualInstallFragmentDoc, {
      render: (gqlVal) => (
        <div class="rounded border-1 border-gray-400 m-10">
          <ManualInstall gql={gqlVal} packagesInstalled={[]} />
        </div>
      ),
    })

    cy.withCtx(async (ctx, o) => {
      ctx.electronApi.copyTextToClipboard = o.sinon.stub()
    })

    const installCommand = `npm install -D @cypress/react @cypress/webpack-dev-server`

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

    const validatePackage = (packageName: string) => {
      cy.findByRole('link', { name: packageName })
      .should('have.attr', 'href', `https://www.npmjs.com/package/${packageName}`)

      cy.contains(framework.description.split('<span')[0])
    }

    validatePackage(framework.package)
    validatePackage(bundler.package)
  })

  it('flags packages already installed', () => {
    cy.mountFragment(ManualInstallFragmentDoc, {
      render: (gqlVal) => (
        <div class="rounded border-1 border-gray-400 m-10">
          <ManualInstall gql={gqlVal} packagesInstalled={['@cypress/react']} />
        </div>
      ),
    })

    cy.findByLabelText('installed').should('be.visible')
  })
})
