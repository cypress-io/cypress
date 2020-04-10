describe('windowSize', () => {
  it('spawns 720p', () => {
    // assert the browser was spawned at 1280x720 and is full size
    // normally e2e tests spawn at fixed size, but this spec should be spawned without passing any width/height arguments in plugins file.
    expect({
      innerWidth: top.window.innerWidth,
      innerHeight: top.window.innerHeight,
      availWidth: top.screen.availWidth,
      availHeight: top.screen.availHeight,
      screenWidth: top.screen.width,
      screenHeight: top.screen.height,
    }).deep.eq({
      innerWidth: 1280,
      innerHeight: 720,
      availWidth: 1280,
      availHeight: 720,
      screenWidth: 1280,
      screenHeight: 720,
    })
  })
})
