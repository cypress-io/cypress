/* eslint-disable
    mocha/handle-done-callback,
    mocha/no-global-tests,
*/
it('catches regular promise errors', () => {
  return Promise.reject(new Error('bar'))
})

it('catches promise errors and calls done with err even when async', (done) => {
  return Promise.resolve(null)
  .then(() => {
    throw new Error('foo')
  })
})
