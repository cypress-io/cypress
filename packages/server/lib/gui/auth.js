const _ = require('lodash')
const bodyParser = require('body-parser')
const debug = require('debug')('cypress:server:auth')
const express = require('express')
const Promise = require('bluebird')
const { shell } = require('electron')
const url = require('url')

const random = require('../util/random')
const windows = require('./windows')
const user = require('../user')

let app
let authCallback
let authState
let server

const getOriginFromUrl = (originalUrl) => {
  const parsedUrl = url.parse(originalUrl)

  return url.format(_.pick(parsedUrl, ['protocol', 'slashes', 'hostname', 'port']))
}

const buildFullLoginUrl = (baseLoginUrl) => {
  const { port } = server.address()

  authState = random.id(32)
  const authUrl = `${baseLoginUrl}?port=${port}&state=${authState}`

  return authUrl
}

/**
 * @returns a promise that is resolved with a user when auth is complete or rejected when it fails
 */
const start = () => {
  return user.getBaseLoginUrl()
  .tap(launchServer)
  .then(buildFullLoginUrl)
  .then((loginUrl) => {
    debug('Trying to open native auth to URL ', loginUrl)

    return launchNativeAuth(loginUrl)
    .catch((e) => {
      debug('Failed to launch native auth, falling back to Electron:', e)

      return launchElectronAuth(loginUrl)
    })
  })
  .then(() => {
    return Promise.fromCallback((cb) => {
      authCallback = cb
    })
  })
  .finally(() => {
    stopServer()
    windows.focusMainWindow()
    windows.closeLoginWindow()
  })
}

/**
 * @returns the currently running auth server instance, launches one if there is not one
 */
const launchServer = (baseLoginUrl) => {
  if (!server) {
    // launch an express server to listen for the auth callback from dashboard
    const origin = getOriginFromUrl(baseLoginUrl)

    debug('Launching auth server expecting origin', origin)
    app = express()

    app.use(bodyParser.json())

    app.use('/auth', (req, res, next) => {
      res.header('Access-Control-Allow-Origin', origin)
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
      res.header('Access-Control-Allow-Methods', 'POST')
      next()
    })

    app.post('/auth', (req, res) => {
      debug('Received POST to /auth with body %o', req.body)

      if (req.body.code && req.body.state === authState) {
        return user.logInFromCode(req.body.code, origin)
        .then((user) => {
          authCallback(undefined, user)
          res.json({ success: true })
        })
        .catch((err) => {
          authCallback(err)
          res.json({ success: false })
        })
      }

      res.json({ success: false })
    })

    return new Promise.fromCallback((cb) => {
      server = app.listen(0, '127.0.0.1', cb)
    })
  }

  return Promise.resolve()
}

const stopServer = () => {
  debug('Closing auth server')
  server.close()
  app = undefined
  authState = undefined
  authCallback = undefined
  server = undefined
}

const launchNativeAuth = (loginUrl) => {
  // wrap openExternal here in case `electron.shell` is not available (during tests)
  return Promise.fromCallback((cb) => {
    shell.openExternal(loginUrl, {}, cb)
  })
}

const launchElectronAuth = (loginUrl) => {
  debug('Opening Electron auth')

  return windows.open(null, {
    position: 'center',
    focus: true,
    width: 1000,
    height: 635,
    preload: false,
    title: 'Login',
    type: 'DASHBOARD_LOGIN',
    url: loginUrl,
  })
}

module.exports = {
  start,
}
