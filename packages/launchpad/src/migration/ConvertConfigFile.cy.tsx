// tslint:disable-next-line: no-implicit-dependencies - need to handle this
import { defaultMessages } from '@cy/i18n'
import { ConvertConfigFileFragmentDoc } from '../generated/graphql-test'
import ConvertConfigFile from './ConvertConfigFile.vue'

describe('<ConvertConfigFile/>', { viewportWidth: 1119 }, () => {
  it('renders the lines for components folder', () => {
    cy.mountFragment(ConvertConfigFileFragmentDoc, {
      onResult (res) {
        res.hasCustomComponentFolder = true

        return res
      },
      render (gql) {
        return (<div class="p-[16px]">
          <ConvertConfigFile gql={gql} />
        </div>)
      },
    })

    cy.findByText('component.specPattern').should('be.visible')
    cy.findByText('componentFolder').should('be.visible')
  })

  it('renders the lines for components testFiles', () => {
    cy.mountFragment(ConvertConfigFileFragmentDoc, {
      onResult (res) {
        res.hasCustomComponentTestFiles = true

        return res
      },
      render (gql) {
        return (<div class="p-[16px]">
          <ConvertConfigFile gql={gql} />
        </div>)
      },
    })

    cy.findByText('component.specPattern').should('be.visible')
    cy.findByText('testFiles').should('be.visible')
    cy.findByText('e2e.specPattern').should('not.exist')
  })

  it('renders the lines for e2e folder', () => {
    cy.mountFragment(ConvertConfigFileFragmentDoc, {
      onResult (res) {
        res.hasCustomIntegrationFolder = true

        return res
      },
      render (gql) {
        return (<div class="p-[16px]">
          <ConvertConfigFile gql={gql} />
        </div>)
      },
    })

    cy.findByText('e2e.specPattern').should('be.visible')
    cy.findByText('integrationFolder').should('be.visible')
  })

  it('renders the lines for e2e testFiles', () => {
    cy.mountFragment(ConvertConfigFileFragmentDoc, {
      onResult (res) {
        res.hasCustomIntegrationTestFiles = true

        return res
      },
      render (gql) {
        return (<div class="p-[16px]">
          <ConvertConfigFile gql={gql} />
        </div>)
      },
    })

    cy.findByText('e2e.specPattern').should('be.visible')
    cy.findByText('testFiles').should('be.visible')
    cy.findByText('componentFolder').should('not.exist')
  })

  it('renders all lines if both are custom', () => {
    cy.mountFragment(ConvertConfigFileFragmentDoc, {
      onResult (res) {
        res.hasCustomIntegrationTestFiles = true
        res.hasCustomComponentFolder = true

        return res
      },
      render (gql) {
        return (<div class="p-[16px]">
          <ConvertConfigFile gql={gql} />
        </div>)
      },
    })

    cy.findByText('e2e.specPattern').should('be.visible')
    cy.findByText('component.specPattern').should('be.visible')
    cy.contains('li', 'testFiles').should('contain', 'e2e.specPattern')
    cy.contains('li', 'componentFolder').should('contain', 'component.specPattern')
  })

  it('renders expected content with title', () => {
    cy.mountFragment(ConvertConfigFileFragmentDoc, {
      render (gql) {
        return (<div class="p-[16px]">
          <ConvertConfigFile gql={gql} />
        </div>)
      },
    })

    cy.contains(defaultMessages.migration.configFile.title).should('be.visible')
  })
})
