const shouldNotExecute = () => {
  throw new Error('Test Override validation should have failed & it block should not have executed.')
}

it('first should not run', () => {
  shouldNotExecute()
})

describe('second should not run', () => {
  it('test', () => {
    shouldNotExecute()
  })
})

describe('nested contexts ', { retries: '1' }, () => {
  describe('test override', () => {
    // eslint-disable-next-line mocha/no-exclusive-tests
    it.only('throws error at the correct line number', { baseUrl: 'not_an_http_url' }, () => {
      shouldNotExecute()
    })
  })
})
