describe('video', () => {
  // https://github.com/cypress-io/cypress/issues/2376
  it('play does not throw error on autoplay', () => {
    cy.visit('/fixtures/video.html')
    cy.get('video').then(($video) => {
      // Older browsers may not return a value from play().
      // Without --autoplay-policy=no-user-gesture-required it throws
      // DOMException: play() failed because the user didn't interact with the document first. https://goo.gl/xX8pDD
      return $video[0].play()
    })
  })
})
