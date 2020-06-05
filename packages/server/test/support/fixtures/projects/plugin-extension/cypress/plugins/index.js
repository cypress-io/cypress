const path = require('path')

module.exports = (onFn, config) => {
  return onFn('before:browser:launch', (browser = {}, options) => {
    const pathToExt = path.resolve('ext')

    options.args.push(`--load-extension=${pathToExt}`)

    return options
  })
}
