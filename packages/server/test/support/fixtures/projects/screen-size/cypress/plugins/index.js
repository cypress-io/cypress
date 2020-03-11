/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on) => {
  on('before:browser:launch', (browser, options) => {
    // options.args.push('-width', '1280', '-height', '1024')

    // return options
  })
}
