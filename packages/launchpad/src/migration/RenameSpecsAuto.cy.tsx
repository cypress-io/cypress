import { defaultMessages } from '@cy/i18n'
import { RenameSpecsAutoFragmentDoc } from '../generated/graphql-test'
import RenameSpecsAuto from './RenameSpecsAuto.vue'
import { formatMigrationFile } from '../utils/stringToRegexp'

describe('<RenameSpecsAuto/>', { viewportWidth: 1119 }, () => {
  it('converts string to RegExp', () => {
    const spec = 'cypress/integration/app.spec.js'
    const re = new RegExp('cypress\/(?<dir>integration)\/.*?(?<ext>[._-]?[s|S]pec.|[.])(?=[j|t]s[x]?)')
    const actual = formatMigrationFile(spec, re)

    expect(actual).to.eql([
      { text: 'cypress/', highlight: false },
      { text: 'integration', highlight: true },
      { text: '/app', highlight: false },
      { text: '.spec.', highlight: true },
      { text: 'js', highlight: false },
    ])
  })

  it('renders the title', () => {
    cy.mountFragment(RenameSpecsAutoFragmentDoc, {
      render (gql) {
        return (<div class="p-16px">
          <RenameSpecsAuto gql={gql} />
        </div>)
      },
    })

    cy.contains(defaultMessages.migration.renameAuto.title).should('be.visible')
  })

  it('renders the change link', () => {
    cy.mountFragment(RenameSpecsAutoFragmentDoc, {
      render (gql) {
        return (<div class="p-16px">
          <RenameSpecsAuto gql={gql} />
        </div>)
      },
    })

    cy.findByText(defaultMessages.migration.renameAuto.changeButton).should('be.visible')
  })

  it('changes the skip status when proceeding to change', () => {
    cy.mountFragment(RenameSpecsAutoFragmentDoc, {
      render (gql) {
        return (<div class="p-16px">
          <RenameSpecsAuto gql={gql} />
        </div>)
      },
    })

    cy.findByText(defaultMessages.migration.renameAuto.optedOutMessage).should('not.exist')
    cy.findByText(defaultMessages.migration.renameAuto.changeButton).click()
    cy.findByText(defaultMessages.migration.renameAuto.modals.step1.buttonProceed).click()
    cy.findByText(defaultMessages.migration.renameAuto.modals.step2.option2).click()
    cy.findByText(defaultMessages.migration.renameAuto.modals.step2.buttonSave).click()
    cy.findByText(defaultMessages.migration.renameAuto.optedOutMessage).should('be.visible')
  })
})
