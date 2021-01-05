/* eslint-disable
    mocha/handle-done-callback,
    mocha/no-global-tests,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
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
