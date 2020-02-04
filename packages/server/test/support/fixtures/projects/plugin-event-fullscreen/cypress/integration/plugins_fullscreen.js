describe('suite', () => {
  it('browser spawned fullscreen', () => {
    // normally e2e tests spawn at fixed size, but this spec should be spawned without passing any width/height arguments in plugins file.
    // this tests asserts that after the page JS forces fullscreen, the dimensions are the same
    // thus the browser was launched in fullscreen
    const sizeBeforeRequestFullScreen = [top.window.innerWidth, top.window.innerHeight]

    cy.then(() => top.document.documentElement.requestFullscreen())
    .then(() => {
      expect([top.window.innerWidth, top.window.innerHeight]).deep.eq(sizeBeforeRequestFullScreen)
    })
  })
})
