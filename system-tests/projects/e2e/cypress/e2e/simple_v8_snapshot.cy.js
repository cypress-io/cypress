describe('simple v8 snapshot spec', () => {
  it('passes', () => {
    expect(Object.keys(window.snapshotResult.customRequire.exports).length).to.equal(0)
  })
})
