describe('devicePixelRatio', () => {
  it('has DPR of 1', () => {
    // assert the browser was spawned with DPR of 1
    expect(window.devicePixelRatio).to.equal(1)
  })
})
