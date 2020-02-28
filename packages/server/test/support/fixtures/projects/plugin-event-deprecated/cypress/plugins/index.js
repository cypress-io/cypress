module.exports = (on, config) => {
  if (config.env.NO_MUTATE_RETURN) {
    on('before:browser:launch', (browser, options) => {
      // this will emit a warning
      options = [...options, '--foo']

      return options
    })

    return
  }

  if (config.env.CONCAT_RETURN) {
    on('before:browser:launch', (browser, options) => {
      // this will emit a warning
      options = options.concat(['--foo'])

      return options
    })

    return
  }

  if (config.env.NO_WARNING) {
    on('before:browser:launch', (browser, options) => {
      // this will NOT emit a warning
      options.args.push('--foo')
      options.args.push('--bar')

      return options
    })

    return
  }

  on('before:browser:launch', (browser, options) => {
    // this will emit a warning
    options.push('--foo')
    options.push('--bar')

    return options
  })
}
