import RecordBanner from './RecordBanner.vue'

describe('<RecordBanner />', () => {
  it('should render expected content', () => {
    cy.mount({ render: () => <RecordBanner modelValue={true} /> })

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

    cy.findByText('cypress run --component --record --key abcd-efg-1234')

    cy.percySnapshot()
  })
})
