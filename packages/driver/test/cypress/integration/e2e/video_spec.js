describe('video', () => {
  it('play does not throw error on autoplay', () => {
    cy.visit('/fixtures/video.html')
    cy.get('video').then(($video) => {
      return $video[0].play()
      .then(() => {
        // Older browsers may not return a value from play().
      })
      .catch((err) => {
        // Without --autoplay-policy=no-user-gesture-required it throws
        // DOMException: play() failed because the user didn't interact with the document first. https://goo.gl/xX8pDD
        expect(err).to.not.exist
      })
    })
  })
})

