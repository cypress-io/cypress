/* eslint-disable
    mocha/handle-done-callback,
    mocha/no-global-tests,
*/
it('catches regular promise errors', () => {
  return Promise.reject(new Error('bar'))
})

it('catches promise errors and calls done with err even when async', (done) => {
  // eslint-disable-next-line mocha/no-return-and-callback -- asserts the error for a test that returns a promise and takes done
  return Promise.resolve(null)
  .then(() => {
    throw new Error('foo')
  })
})
