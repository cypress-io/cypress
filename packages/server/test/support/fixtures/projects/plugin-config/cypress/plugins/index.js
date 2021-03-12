module.exports = (on, config, mode) => {
  if (mode !== 'e2e') {
    throw Error('This is an e2e project. mode should be `e2e`.')
  }

  return new Promise((resolve) => {
    setTimeout(resolve, 100)
  })
  .then(() => {
    config.defaultCommandTimeout = 500
    config.videoCompression = 20
    config.env.foo = 'bar'

    return config
  })
}
