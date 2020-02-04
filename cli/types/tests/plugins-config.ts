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
