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
