// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'
import RecordBanner from './RecordBanner.vue'
import { TrackedBanner_RecordBannerSeenDocument } from '../../generated/graphql'

describe('<RecordBanner />', () => {
  it('should render expected content', () => {
    cy.mount({ render: () => <RecordBanner hasBannerBeenShown={false} /> })

    cy.gqlStub.Query.currentProject = {
      id: 'test_id',
      title: 'project_title',
      currentTestingType: 'component',
      cloudProject: {
        __typename: 'CloudProject',
        id: 'cloud_id',
        recordKeys: [{
          __typename: 'CloudRecordKey',
          id: 'recordKey1',
          key: 'abcd-efg-1234',
        }],
      } as any,
    } as any

    cy.contains(defaultMessages.specPage.banners.record.title).should('be.visible')
    cy.contains(defaultMessages.specPage.banners.record.content).should('be.visible')

    cy.findByDisplayValue('npx cypress run --component --record --key abcd-efg-1234').should('be.visible')

    cy.percySnapshot()
  })

  it('should record expected event on mount', () => {
    const recordEvent = cy.stub().as('recordEvent')

    cy.stubMutationResolver(TrackedBanner_RecordBannerSeenDocument, (defineResult, event) => {
      recordEvent(event)

      return defineResult({ recordEvent: true })
    })

    cy.mount({ render: () => <RecordBanner hasBannerBeenShown={false} /> })

    cy.get('@recordEvent').should('have.been.calledWith', {
      campaign: 'Record Runs',
      medium: 'Specs Record Runs Banner',
      messageId: Cypress.sinon.match.string,
      cohort: 'n/a',
    })
  })
})
