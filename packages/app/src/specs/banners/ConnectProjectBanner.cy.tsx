import ConnectProjectBanner from './ConnectProjectBanner.vue'

describe('<ConnectProjectBanner />', () => {
  it('should render expected content', () => {
    cy.mount({ render: () => <ConnectProjectBanner modelValue={true} /> })

    cy.percySnapshot()
  })
})
