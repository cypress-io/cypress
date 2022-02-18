import { ComponentDep, COMPONENT_DEPS } from '@packages/types/src'
import { ManualInstallFragmentDoc } from '../generated/graphql-test'
import ManualInstall from './ManualInstall.vue'

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
    const framework = COMPONENT_DEPS.cypressReact
    const bundler = COMPONENT_DEPS.cypressWebpackDevServer

    cy.mountFragment(ManualInstallFragmentDoc, {
      render: (gqlVal) => (
        <div class="rounded border-1 border-gray-400 m-10">
          <ManualInstall gql={gqlVal} packagesInstalled={[]} />
        </div>
      ),
    })

    const installCommand = `yarn add -D ${framework.package} ${bundler.package}`

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

    const validatePackage = (dep: ComponentDep) => {
      cy.findByRole('link', { name: dep.package })
      .should('have.attr', 'href', `https://www.npmjs.com/package/${dep.name}`)

      cy.contains(dep.description.split('<span')[0])
    }

    validatePackage(framework)
    validatePackage(bundler)
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
