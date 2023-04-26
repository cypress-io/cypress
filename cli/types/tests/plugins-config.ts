// checking types passed to cypress/plugins/index.js file

import { expectType } from "."

// does nothing
const pluginConfig: Cypress.PluginConfig = (on, config) => {}

// allows synchronous returns
const pluginConfig2: Cypress.PluginConfig = (on, config) => {
expectType<Cypress.PluginConfigOptions>(  config)
expectType<string>(  config.configFile)
expectType<string | false>(  config.fixturesFolder)
expectType<string | false>(  config.screenshotsFolder)
expectType<number | false>(  config.videoCompression)
expectType<string>(  config.projectRoot)
expectType<string>(  config.version)
expectType<Cypress.TestingType>(  config.testingType)
expectType<Cypress.Browser[]>(  config.browsers)

  on('before:browser:launch', (browser, options) => {
expectType<string>(    browser.displayName)
expectType<string[]>(    options.extensions)
expectType<string[]>(    options.args)
expectType<{ [key: string]: any; }>(    options.env)

    console.log('launching browser', browser.displayName)
    return options
  })

  on('file:preprocessor', (file) => {
expectType<string>(    file.filePath)
expectType<string>(    file.outputPath)
expectType<boolean>(    file.shouldWatch)
expectType<() => number>(    file.getMaxListeners)

    return file.outputPath
  })

  on('after:screenshot', (details) => {
expectType<number>(    details.size)
expectType<string>(    details.takenAt)
expectType<number>(    details.duration)
expectType<Cypress.Dimensions>(    details.dimensions)
expectType<boolean>(    details.multipart)
expectType<number>(    details.pixelRatio)
expectType<string>(    details.name)
expectType<string>(    details.specName)
expectType<boolean>(    details.testFailure)
expectType<string>(    details.path)
expectType<boolean>(    details.scaled)
expectType<string[]>(    details.blackout)

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

  // @ts-expect-error
  on('file:preprocessor', (file) => {}) 

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
// @ts-expect-error
const pluginConfig5: Cypress.PluginConfig = (on, config) => {
  return {
    unknownKey: 42
  }
}
