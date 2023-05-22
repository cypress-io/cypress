import faker from 'faker'
import TrackedWarning from './TrackedWarning.vue'
import { defaultMessages } from '@cy/i18n'
import { BannerIds } from '@packages/types/src'
import { TrackedWarning_SetProjectStateDocument } from '../../../launchpad/src/generated/graphql-test'

describe('<TrackedWarning />', () => {
  it('calls dismiss when X is clicked', () => {
    const title = faker.hacker.noun()
    const message = `
  # Hello!
  > This is a **markdown formatted** message!
  
  We're going to print out some \`console.log('cool code')\` and see how well it formats inside of our warning.
  `
    const bannerId = BannerIds.ACI_052023_GIT_NOT_DETECTED
    const recordStub = cy.stub()

    cy.clock(1234)

    cy.stubMutationResolver(TrackedWarning_SetProjectStateDocument, (defineResult, { value }) => {
      recordStub(value)

      return defineResult({ setPreferences: {} as any })
    })

    // Initially mount as visible
    cy.mount(<TrackedWarning data-cy="warning" title={title} message={message} bannerId={bannerId} />)

    cy.get('[data-cy=warning]').as('warning')

    cy.get('@warning').should('be.visible')
    cy.get(`[aria-label=${defaultMessages.components.alert.dismissAriaLabel}`).first().click()
    cy.get('@warning').should('not.exist').then(() => {
      expect(recordStub).to.have.been.calledWith(`{"banners":{"${bannerId}":{"dismissed":1234}}}`)
    })
  })
})
