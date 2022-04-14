describe('windowSize', () => {
  it('spawns maximized', () => {
    // normally e2e tests spawn at fixed size, but this spec should be spawned without passing any width/height arguments in plugins file.
    expect(top.window.innerWidth).eq(top.screen.availWidth)
    // expect(top.window.innerHeight).closeTo(top.screen.availHeight - 100)
  })
})
