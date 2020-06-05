// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
module.exports = (onFn, config) => {
  return onFn('before:browser:launch', (browser, options) => {
    const { name } = browser

    switch (name) {
      case 'chrome':
        return [name, 'foo', 'bar', 'baz']
      case 'electron':
        return {
          preferences: {
            browser: 'electron',
            foo: 'bar',
          },
        }
      default:
        throw new Error(`unrecognized browser name: '${name}' for before:browser:launch`)
    }
  })
}
