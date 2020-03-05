/* eslint-disable */

describe('e2e browser crashing runner spec', () => {
  it('freezes the runner', () => {
    let a = 'a'

    while (true) {
      a += 'a'
    }
  })
})
