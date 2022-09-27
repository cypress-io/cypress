import RunsEmpty from './RunsEmpty.vue'
import { defaultMessages } from '@cy/i18n'

describe('RunsEmpty', () => {
  it('renders expected content', () => {
    cy.mount(<RunsEmpty />)

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
    cy.contains('npx cypress run --component --record --key abcd-efg-1234').should('be.visible')
  })
})
