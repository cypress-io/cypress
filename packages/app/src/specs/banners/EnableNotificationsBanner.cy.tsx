import EnableNotificationsBanner from './EnableNotificationsBanner.vue'

describe('EnableNotificationsBanner', () => {
  [1200].forEach((viewportWidth) => {
    it(`renders at ${viewportWidth}px width`, { viewportWidth }, () => {
      cy.mount(() => (<div class="p-12 resize overflow-auto"><EnableNotificationsBanner /></div>))
      cy.percySnapshot()
    })
  })
})
