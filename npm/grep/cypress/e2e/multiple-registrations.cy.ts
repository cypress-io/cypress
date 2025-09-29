// register the plugin multiple times
// to simulate including from support and spec files
// https://github.com/cypress-io/cypress-grep/issues/59
const { register } = require('../../src/register')

register()
register()
register()

it('hello world', () => {})
