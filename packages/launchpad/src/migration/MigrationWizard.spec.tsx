import { MigrationWizardFragmentDoc } from '../generated/graphql-test'
import MigrationWizard from './MigrationWizard.vue'

describe('<MigrationWizard/>', { viewportWidth: 1280, viewportHeight: 1100 }, () => {
  it('renders Automatic rename', () => {
    cy.mountFragment(MigrationWizardFragmentDoc, {
      onResult (res) {
        res.step = 'renameAuto'
      },
      render (gql) {
        return (<div class="p-16px">
          <MigrationWizard gql={gql} />
        </div>)
      },
    })
  })

  it('renders Manual rename', () => {
    cy.mountFragment(MigrationWizardFragmentDoc, {
      onResult (res) {
        res.step = 'renameManual'
      },
      render (gql) {
        return (<div class="p-16px">
          <MigrationWizard gql={gql} />
        </div>)
      },
    })
  })

  it('renders Config File migration', () => {
    cy.mountFragment(MigrationWizardFragmentDoc, {
      onResult (res) {
        res.step = 'configFile'
      },
      render (gql) {
        return (<div class="p-16px">
          <MigrationWizard gql={gql} />
        </div>)
      },
    })
  })
})
