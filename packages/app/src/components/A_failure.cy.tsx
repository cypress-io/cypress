describe('a_failure: fails 10 times to force run skip', () => {
  it('fails 1', function () {
    assert.fail('actual', 'expected', 'Failure 1')
  })

  it('fails 2', function () {
    assert.fail('actual', 'expected', 'Failure 2')
  })

  it('fails 3', function () {
    assert.fail('actual', 'expected', 'Failure 3')
  })

  it('fails 4', function () {
    assert.fail('actual', 'expected', 'Failure 4')
  })

  it('fails 5', function () {
    assert.fail('actual', 'expected', 'Failure 5')
  })

  it('fails 6', function () {
    assert.fail('actual', 'expected', 'Failure 6')
  })

  it('fails 7', function () {
    assert.fail('actual', 'expected', 'Failure 7')
  })

  it('fails 8', function () {
    assert.fail('actual', 'expected', 'Failure 8')
  })

  it('fails 9', function () {
    assert.fail('actual', 'expected', 'Failure 9')
  })

  it('fails 10', function () {
    assert.fail('actual', 'expected', 'Failure 10')
  })
})
