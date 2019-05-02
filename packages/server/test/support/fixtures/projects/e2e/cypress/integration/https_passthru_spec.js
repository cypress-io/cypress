describe('https passthru retries', function () {
  it('retries when visiting a non-test domain', function (done) {
    const img = new Image()

    img.src = 'https://localhost:13371'
    img.onload = done
  })
})
