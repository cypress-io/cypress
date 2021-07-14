describe('windowSize', () => {
  it('spawns with correct default size', () => {
    // assert the browser was spawned at 1920x1080 and is full size
    // normally e2e tests spawn at fixed size, but this spec should be spawned without passing any width/height arguments in plugins file.
    // TODO: look into fixing screen/available height and width
    expect({
      innerWidth: top.window.innerWidth,
      innerHeight: top.window.innerHeight,
      // screenWidth: top.screen.width,
      // screenHeight: top.screen.height,
      // availWidth: top.screen.availWidth,
      // availHeight: top.screen.availHeight,
    }).deep.eq({
      innerWidth: 1920,
      innerHeight: 1080,
      // screenWidth: 1920,
      // screenHeight: 1080,
      // availWidth: 1920,
      // availHeight: 1080,
    })
  })
})
