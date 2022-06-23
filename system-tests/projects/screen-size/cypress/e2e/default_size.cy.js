describe('windowSize', () => {
  it('spawns with correct default size', () => {
    // assert the browser was spawned at 1280x720 and is full size
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
      innerWidth: 1280,
      innerHeight: 720,
      // screenWidth: 1280,
      // screenHeight: 720,
      // availWidth: 1280,
      // availHeight: 720,
    })
  })
})
