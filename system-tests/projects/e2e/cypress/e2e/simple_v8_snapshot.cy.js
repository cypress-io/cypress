describe('simple v8 snapshot spec', () => {
  it('passes', () => {
    // Snapshot result needs to be undefined in the renderer process
    expect(window.getSnapshotResult).to.be.undefined
  })
})
