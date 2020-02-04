describe('suite', () => {
  it('browser spawned fullscreen', () => {
    // normally e2e tests spawn at fixed size, but this spec should be spawned without passing any width/height arguments in plugins file.
    expect([top.window.innerWidth, top.window.innerHeight]).deep.eq([top.screen.width, top.screen.height - (Cypress.browser.name === 'chrome' ? 46 : 0)])
  })
})
