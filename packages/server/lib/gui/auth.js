const express = require('express')
const { shell } = require('electron')

const windows = require('./windows')
const user = require('../user')

let app
let server

/**
 * @returns a promise that is resolved with auth code when auth is complete or rejected when it fails
 */
const start = (provider, options) => {
  return user.getLoginUrl(provider)
  .then((url) => {
    return launchNativeAuth(url)
    .catch(() => {
      return launchElectronAuth(url, options)
    })
  })
}

/**
 * @returns the currently running auth server instance, launches one if there is not one
 */
const launchServer = (cb) => {
  if (!server) {
    app = express()

    app.get('/', (req, res) => {
      res.send('<html><body><script>window.close();</script></body></html>')
      if (req.query.code) {
        app.cb(req.query.code)
        stopServer()
      }

      if (req.query.error) {
        stopServer()
        throw new Error(`Auth error: ${req.query.error}`)
      }
    })

    server = app.listen(62214)
  }

  app.cb = cb

  return server
}

const stopServer = () => {
  server.close()
  app = undefined
  server = undefined
}

const launchNativeAuth = (url) => {
  return new Promise((resolve) => {
    // launch an express server to listen for the auth redirect
    launchServer(resolve)
    shell.openExternal(url)
  })
}

const launchElectronAuth = (url, options) => {
  return windows.open(options.projectRoot, {
    position: 'center',
    focus: true,
    width: 1000,
    height: 635,
    preload: false,
    title: 'Login',
    type: 'GITHUB_LOGIN',
    url,
  })
}

module.exports = {
  start,
}
