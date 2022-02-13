import { ManualInstallFragmentDoc } from '../generated/graphql-test'
import ManualInstall from './ManualInstall.vue'
import { PACKAGES_DESCRIPTIONS } from '../../../types/src/constants'

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
    const framework = '@cypress/react'
    const bundler = '@cypress/webpack-dev-server'

    cy.mountFragment(ManualInstallFragmentDoc, {
      render: (gqlVal) => (
        <div class="rounded border-1 border-gray-400 m-10">
          <ManualInstall gql={gqlVal} packagesInstalled={[]} />
        </div>
      ),
    })

    const installCommand = `yarn add -D ${framework} ${bundler}`

    // @ts-ignore
    cy.findByRole('button', { name: 'Copy' }).realClick()

    cy.findByRole('button', { name: 'Copied!' }).then(() => {
      expect(cy.componentCtx.mutationData.copyText).to.equal(installCommand)
    })

    const validatePackage = (packageName) => {
      cy.findByRole('link', { name: packageName })
      .should('have.attr', 'href', `https://www.npmjs.com/package/${packageName}`)

      cy.contains(PACKAGES_DESCRIPTIONS[framework].split('<span')[0])
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
