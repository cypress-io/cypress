// // const cp = require('child_process')

// // cp.exec('http-server -p 5006 dist')

// const express = require('express')

// express().use(express.static('dist')).listen(5006)
// /**
//  * @type {Cypress.PluginConfig}
//  */
// module.exports = (on: Function) => {
// }

const { startDevServer } = require('@cypress/webpack-dev-server')

module.exports = (on, config) => {
  on('dev-server:start', (options) => {
    return startDevServer({
      webpackConfig: require('@vue/cli-service/webpack.config'),
      options,
    })
  })

  return config
}
