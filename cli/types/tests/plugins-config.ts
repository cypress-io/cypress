// checking types passed to cypress/plugins/index.js file

// does nothing
const pluginConfig: Cypress.PluginConfig = (on, config) => {}

// allows synchronous returns
const pluginConfig2: Cypress.PluginConfig = (on, config) => {
  config // $ExpectType PluginConfigOptions
  config.configFile // $ExpectType string
  config.fixturesFolder // $ExpectType string | false
  config.screenshotsFolder // $ExpectType string | false
  config.videoCompression // $ExpectType number | false
  config.projectRoot // $ExpectType string
  config.version // $ExpectType string
  config.testingType // $ExpectType TestingType
  config.browsers // $ExpectType Browser[]

  on('before:browser:launch', (browser, options) => {
    browser.displayName // $ExpectType string
    options.extensions // $ExpectType string[]
    options.args // $ExpectType string[]
    options.env // $ExpectType { [key: string]: any; }

    console.log('launching browser', browser.displayName)
    return options
  })

  on('file:preprocessor', (file) => {
    file.filePath // $ExpectType string
    file.outputPath // $ExpectType string
    file.shouldWatch // $ExpectType boolean
    file.getMaxListeners // $ExpectType () => number

    return file.outputPath
  })

  on('after:screenshot', (details) => {
    details.size // $ExpectType number
    details.takenAt // $ExpectType string
    details.duration // $ExpectType number
    details.dimensions // $ExpectType Dimensions
    details.multipart // $ExpectType boolean
    details.pixelRatio // $ExpectType number
    details.name // $ExpectType string
    details.specName // $ExpectType string
    details.testFailure // $ExpectType boolean
    details.path // $ExpectType string
    details.scaled // $ExpectType boolean
    details.blackout // $ExpectType string[]

    return {
      path: '/path/to/screenshot',
      size: 1000,
      // FIXME: why can't dimensions be included?
      // dimensions: {
      //   width: 100,
      //   height: 100,
      // }
    }
  })

  on('task', {
    foo() {
      return true
    }
  })

  return {
    e2e: {
      baseUrl: 'http://localhost:3000'
    }
  }
}

// allows/disallows void returns
const pluginConfig3: Cypress.PluginConfig = (on, config) => {
  on('before:browser:launch', (browser, options) => {})

  on('file:preprocessor', (file) => {}) // $ExpectError

  on('after:screenshot', () => {})

  // FIXME: this should error, but doesn't because the type isn't quite right
  // on('task', { // $ExpectError
  //   foo() {}
  // })
}

// allows async returns
const pluginConfig4: Cypress.PluginConfig = (on, config) => {
  on('before:browser:launch', (browser, options) => {
    return Promise.resolve(options)
  })

  on('file:preprocessor', (file) => {
    return Promise.resolve(file.outputPath)
  })

  on('after:screenshot', () => {
    return Promise.resolve({})
  })

  on('task', {
    foo() {
      return Promise.resolve([])
    }
  })

  return Promise.resolve({
    e2e: {
      baseUrl: 'http://localhost:3000'
    }
  })
}

// does not allow returning unknown properties
const pluginConfig5: Cypress.PluginConfig = (on, config) => { // $ExpectError
  return {
    unknownKey: 42
  }
}
