import CreateOrganizationBanner from './CreateOrganizationBanner.vue'

describe('<CreateOrganizationBanner />', () => {
  it('should render expected content', () => {
    cy.mount({ render: () => <CreateOrganizationBanner modelValue={true} /> })

    cy.percySnapshot()
  })
})
