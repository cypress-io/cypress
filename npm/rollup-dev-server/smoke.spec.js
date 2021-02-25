if (module) {
  module.hot.accept(() => {
    window.location.reload()
  })
}

describe('With no imports', () => {
  it('should be able to run this', () => {
    expect(true).to.be.true
  })
})
