describe('windowSize', () => {
  it('spawns with correct default size', () => {
    // assert the browser was spawned at 1280x720 and is full size
    // normally e2e tests spawn at fixed size, but this spec should be spawned without passing any width/height arguments in plugins file.
    if (Cypress.browser.name === 'chrome') {
      // NOTE: there is a bug in chrome headless=new where height is not spawned correctly
      // the issue is marked as fixed, but others are still running into it in Chrome 116
      // @see https://bugs.chromium.org/p/chromium/issues/detail?id=1416398
      expect({
        innerWidth: top.window.innerWidth,
        innerHeight: top.window.innerHeight,
      }).deep.eq({
        innerWidth: 1280,
        innerHeight: 633, // chrome 119 increased the size here from 599 to 633
      })
    } else {
      expect({
        innerWidth: top.window.innerWidth,
        innerHeight: top.window.innerHeight,
      }).deep.eq({
        innerWidth: 1280,
        innerHeight: 720,
      })
    }
  })
})
