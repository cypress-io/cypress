const cp = require('child_process')

cp.exec('http-server -p 5006 dist')

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on: Function) => {
}
