describe('windowSize', () => {
  it('spawns with correct default size', () => {
    // assert the browser was spawned at 1280x720 and is full size
    // normally e2e tests spawn at fixed size, but this spec should be spawned without passing any width/height arguments in plugins file.
    // TODO: look into fixing screen/available height and width
    if (Cypress.browser.name === 'chrome') {
      // NOTE: there is a bug in chrome headless=new where height is not spawned correctly
      // the issue is marked as fixed, but others are still running into it in Chrome 116
      // @see https://bugs.chromium.org/p/chromium/issues/detail?id=1416398
      expect({
        innerWidth: top.window.innerWidth,
        innerHeight: top.window.innerHeight,
        // screenWidth: top.screen.width,
        // screenHeight: top.screen.height,
        // availWidth: top.screen.availWidth,
        // availHeight: top.screen.availHeight,
      }).deep.eq({
        innerWidth: 1280,
        innerHeight: 581, // chrome 128 decreased the size here from 633 to 581
        // screenWidth: 1280,
        // screenHeight: 603,
        // availWidth: 1280,
        // availHeight: 603,
      })
    } else {
      expect({
        innerWidth: top.window.innerWidth,
        innerHeight: top.window.innerHeight,
        // screenWidth: top.screen.width,
        // screenHeight: top.screen.height,
        // availWidth: top.screen.availWidth,
        // availHeight: top.screen.availHeight,
      }).deep.eq({
        innerWidth: 1280,
        innerHeight: 720,
        // screenWidth: 1280,
        // screenHeight: 720,
        // availWidth: 1280,
        // availHeight: 720,
      })
    }
  })
})
