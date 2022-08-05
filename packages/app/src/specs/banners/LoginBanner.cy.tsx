import LoginBanner from './LoginBanner.vue'

describe('<LoginBanner />', () => {
  it('should render expected content', () => {
    cy.mount({ render: () => <LoginBanner modelValue={true} /> })

    cy.percySnapshot()
  })
})
