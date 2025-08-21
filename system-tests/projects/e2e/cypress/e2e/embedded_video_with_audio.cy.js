describe('page with video', () => {
  it('plays the video', () => {
    cy.visit('/cypress/fixtures/video.html')
    cy.get('video').should('have.prop', 'paused', false)
  })
})
