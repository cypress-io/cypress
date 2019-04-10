const bodyParser = require('body-parser')
const debug = require('debug')('cypress:server:auth')
const express = require('express')
const Promise = require('bluebird')
const { shell } = require('electron')

const konfig = require('../konfig')
const random = require('../util/random')
const windows = require('./windows')
const user = require('../user')

const openExternalAsync = Promise.promisify(shell.openExternal)

let app
let authCallback
let server

const getAllowedOrigin = () => {
  return konfig('dashboard_url')
}

const getDashboardAuthUrl = () => {
  return user.getLoginUrl()
  .then((url) => {
    const { port } = server.address()

    app.state = random.id(32)
    const authUrl = `${url}?port=${port}&state=${app.state}`

    return authUrl
  })
}

/**
 * @returns a promise that is resolved with auth info when auth is complete or rejected when it fails
 */
const start = () => {
  return launchServer()
  .then(getDashboardAuthUrl)
  .then((url) => {
    debug('Trying to open native auth to URL ', url)

    return launchNativeAuth(url)
    .catch((e) => {
      debug('Failed to launch native auth, falling back to Electron:', e.message)

      return launchElectronAuth(url)
    })
  })
  .then(() => {
    return new Promise((resolve) => {
      authCallback = resolve
    })
  })
  .tap(stopServer)
}

/**
 * @returns the currently running auth server instance, launches one if there is not one
 */
const launchServer = () => {
  if (!server) {
    debug('Launching auth server')
    app = express()

    app.use(bodyParser.json())

    app.use('/auth', (req, res, next) => {
      res.header('Access-Control-Allow-Origin', getAllowedOrigin())
      res.header('Access-Control-Allow-Headers', '*')
      res.header('Access-Control-Allow-Methods', 'POST')
      next()
    })

    app.post('/auth', (req, res) => {
      debug('Received POST to /auth with body %o', req.body)

      if (req.body.accessToken && authCallback) {
        res.json({ success: true }).end()
        authCallback(req.body)

        return
      }

      res.json({ success: false }).end()
    })

    return new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', resolve)
    })
  }

  return Promise.resolve()
}

const stopServer = () => {
  debug('Closing auth server')
  server.close()
  app = undefined
  server = undefined
}

const launchNativeAuth = (url) => {
  // launch an express server to listen for the auth redirect
  return openExternalAsync(url, {})
}

const launchElectronAuth = (url) => {
  debug('Opening Electron auth')

  return windows.open({
    position: 'center',
    focus: true,
    width: 1000,
    height: 635,
    preload: false,
    title: 'Login',
    type: 'DASHBOARD_LOGIN',
    url,
  })
}

module.exports = {
  start,
}
