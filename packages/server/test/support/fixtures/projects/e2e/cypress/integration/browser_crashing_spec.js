describe('e2e browser crashing spec', () => {
  it('freezes the browser', () => {
    let a = true

    while (a || !a) {
      a = !a
    }
  })
})
