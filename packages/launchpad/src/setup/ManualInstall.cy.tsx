import sinon from 'sinon'
import { ManualInstallFragmentDoc } from '../generated/graphql-test'
import ManualInstall from './ManualInstall.vue'
import * as deps from '@packages/scaffold-config/src/dependencies'
// tslint:disable-next-line: no-implicit-dependencies - need to handle this
import { defaultMessages } from '@cy/i18n'
import { Clipboard_CopyToClipboardDocument } from '../generated/graphql'

describe('<ManualInstall />', () => {
  it('playground', () => {
    cy.mountFragment(ManualInstallFragmentDoc, {
      render: (gqlVal) => (
        <div class="rounded border border-gray-400 m-10">
          <ManualInstall gql={gqlVal} />
        </div>
      ),
    })
  })

  it('lists packages and can copy install command to clipboard', { viewportWidth: 800, viewportHeight: 600 }, () => {
    const framework = deps.WIZARD_DEPENDENCY_REACT
    const language = deps.WIZARD_DEPENDENCY_TYPESCRIPT

    const stubCopy = sinon.stub()

    cy.mountFragment(ManualInstallFragmentDoc, {
      render: (gqlVal) => (
        <div class="rounded border border-gray-400 m-10">
          <ManualInstall gql={gqlVal} />
        </div>
      ),
    })

    cy.stubMutationResolver(Clipboard_CopyToClipboardDocument, (defineResult, { text }) => {
      stubCopy(text)

      return defineResult({
        copyTextToClipboard: true,
      })
    })

    const installCommand = `npm install -D react react-dom typescript`

    cy.findByText(defaultMessages.setupWizard.installDependencies.pasteCommand).should('be.visible')
    cy.findByDisplayValue(installCommand).should('be.visible')
    cy.findByRole('button', { name: 'Copy' }).click()
    cy.findByRole('button', { name: 'Copied!' }).should('be.visible')

    cy.wrap(stubCopy).should('have.been.calledWith', installCommand)

    const validatePackage = (packageName: string) => {
      cy.findByRole('link', { name: packageName })
      .should('have.attr', 'href', `https://www.npmjs.com/package/${packageName}`)

      cy.contains(framework.description.split('<span')[0])
    }

    validatePackage(framework.package)
    validatePackage(language.package)
  })

  it('flags packages already installed', () => {
    cy.mountFragment(ManualInstallFragmentDoc, {
      render: (gqlVal) => (
        <div class="rounded border border-gray-400 m-10">
          <ManualInstall gql={gqlVal} />
        </div>
      ),
    })

    cy.get('[aria-label="installed"]').should('be.visible')
  })
})
