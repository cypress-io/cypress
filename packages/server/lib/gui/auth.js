const bodyParser = require('body-parser')
const debug = require('debug')('cypress:server:auth')
const express = require('express')
const Promise = require('bluebird')
const { shell } = require('electron')

const konfig = require('../konfig')
const random = require('../util/random')
const windows = require('./windows')
const user = require('../user')

let app
let server

const getAllowedOrigin = () => {
  return konfig('dashboard_url')
}

/**
 * @returns a promise that is resolved with auth token when auth is complete or rejected when it fails
 */
const start = (options) => {
  return user.getLoginUrl()
  .then((url) => {
    return launchNativeAuth(url.dashboardAuthUrl)
    .catch((e) => {
      debug('Failed to launch native auth, falling back to Electron:', e.message)

      return launchElectronAuth(options)
    })
  })
}

/**
 * @returns the currently running auth server instance, launches one if there is not one
 */
const launchServer = () => {
  if (!server) {
    app = express()

    app.use(bodyParser.json())

    app.all('/auth', (req, res, next) => {
      debug('Received OPTIONS to /auth')
      res.header('Access-Control-Allow-Origin', getAllowedOrigin())
      res.header('Access-Control-Allow-Headers', '*')
      res.header('Access-Control-Allow-Methods', 'POST')
      next()
    })

    app.post('/auth', (req, res) => {
      debug('Received POST to /auth with body %o', req.body)

      if (req.body.code && app.cb) {
        res.json({ success: true })
        app.cb(req.body)
        stopServer()
      }

      if (req.body.error) {
        res.json({ success: false })
        stopServer()
        throw new Error(`Auth error: ${req.query.error}`)
      }
    })

    return new Promise((resolve) => {
      server = app.listen(resolve)
    })
  }

  return Promise.resolve()
}

const stopServer = () => {
  server.close()
  app = undefined
  server = undefined
}

const launchNativeAuth = (url) => {
  // launch an express server to listen for the auth redirect
  return launchServer().then(() => {
    const { port } = server.address()

    app.state = random.id(32)
    const authUrl = `${url}?port=${port}&state=${app.state}`

    debug('Opening native auth: ', authUrl)

    shell.openExternal(authUrl)
  }).then(() => {
    return new Promise((resolve) => {
      app.cb = resolve
    })
  })
}

const launchElectronAuth = (options) => {
  debug('Opening Electron auth')

  return windows.open(options.projectRoot, {
    position: 'center',
    focus: true,
    width: 1000,
    height: 635,
    preload: false,
    title: 'Login',
    type: 'DASHBOARD_LOGIN',
  })
}

module.exports = {
  start,
}
