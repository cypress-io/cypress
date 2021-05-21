// const cp = require('child_process')

// cp.exec('http-server -p 5006 dist')

const express = require('express')

express().use(express.static('dist')).listen(5006)
/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on: Function) => {}
