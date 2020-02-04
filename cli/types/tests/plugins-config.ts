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
  on('before:browser:launch', (browser, options) => {
    browser.displayName // $ExpectType string

    console.log('launching browser', browser.displayName)
    return options
  })
}
