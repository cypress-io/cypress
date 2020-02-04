// checking types passed to cypress/plugins/index.js file

// does nothing
const pluginConfig: Cypress.PluginConfig = (on, config) => {}

// returns changed base url
const pluginConfig2: Cypress.PluginConfig = (on, config) => {
  return {
    baseUrl: 'http://localhost:3000'
  }
}

// listens to browser launch event
const pluginConfig3: Cypress.PluginConfig = (on, config) => {
  config // $ExpectType ConfigOptions
  config.baseUrl // $ExpectType: string

  on('before:browser:launch', (browser, options) => {
    browser.displayName // $ExpectType string

    console.log('launching browser', browser.displayName)
    return options
  })
}

// returns changed base url asynchronously
const pluginConfig4: Cypress.PluginConfig = (on, config) => {
  return Promise.resolve({
    baseUrl: 'http://localhost:3000'
  })
}

// does not allow returning unknown properties
const pluginConfig5: Cypress.PluginConfig = (on, config) => { // $ExpectError
  return {
    unknownKey: 42
  }
}

// registers task that forgets to return a null or a Promise
const pluginConfig6: Cypress.PluginConfig = (on, config) => {
  const tasks = {
    hello() {
      // oops, returning undefined
    },
  }
  on('task', tasks) // $ExpectError
}

// good tasks
const pluginConfig7: Cypress.PluginConfig = (on, config) => {
  on('task', {
    bye() {
      // a Task should return null
      return null
    },
    load() {
      // or a promise
      return Promise.resolve()
    }
  })
}
