/* eslint-disable
    brace-style,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const random = require('randomstring')

const id = () =>
//# return a random id
{
  return random.generate({
    length: 5,
    capitalization: 'lowercase',
  })
}


module.exports = {
  id,
}
