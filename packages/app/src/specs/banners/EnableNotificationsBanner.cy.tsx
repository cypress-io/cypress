import EnableNotificationsBanner from './EnableNotificationsBanner.vue'

describe('EnableNotificationsBanner', () => {
  [1200, 800].forEach((viewportWidth) => {
    it(`renders at ${viewportWidth}px width`, { viewportWidth }, () => {
      cy.mount(<EnableNotificationsBanner />)
      cy.percySnapshot()
    })
  })
})
