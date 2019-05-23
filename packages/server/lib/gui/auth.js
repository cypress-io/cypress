const _ = require('lodash')
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

const _buildFullLoginUrl = (baseLoginUrl, server) => {
  const { port } = server.address()

  authState = random.id(32)
  const authUrl = `${baseLoginUrl}?port=${port}&state=${authState}`

  return authUrl
}

const _getOriginFromUrl = (originalUrl) => {
  const parsedUrl = url.parse(originalUrl)

  return url.format(_.pick(parsedUrl, ['protocol', 'slashes', 'hostname', 'port']))
}

/**
 * @returns a promise that is resolved with a user when auth is complete or rejected when it fails
 */
const start = () => {
  return user.getBaseLoginUrl()
  .tap(_launchServer)
  .then((baseLoginUrl) => {
    return _buildFullLoginUrl(baseLoginUrl, server)
  })
  .then((loginUrl) => {
    debug('Trying to open native auth to URL ', loginUrl)

    return _launchNativeAuth(loginUrl)
    .catch((e) => {
      debug('Failed to launch native auth, falling back to Electron:', e)

      return _launchElectronAuth(loginUrl)
    })
  })
  .then(() => {
    return Promise.fromCallback((cb) => {
      authCallback = cb
    })
  })
  .finally(() => {
    _stopServer()
    windows.focusMainWindow()
    windows.closeLoginWindow()
  })
}

/**
 * @returns the currently running auth server instance, launches one if there is not one
 */
const _launchServer = (baseLoginUrl) => {
  if (!server) {
    // launch an express server to listen for the auth callback from dashboard
    const origin = _getOriginFromUrl(baseLoginUrl)

    debug('Launching auth server with origin', origin)
    app = express()

    app.get('/auth', (req, res) => {
      debug('Received GET to /auth with query params %o', req.query)

      const redirectToStatus = (status) => {
        res.redirect(`${baseLoginUrl}?status=${status}`)
      }

      if (_.get(req.query, 'status') === 'error') {
        authCallback(new Error('There was an error authenticating to the Cypress dashboard.'))
        redirectToStatus('error')
      }

      const { state, name, email, access_token } = req.query

      if (state === authState && access_token) {
        const userObj = {
          name,
          email,
          authToken: access_token,
        }

        return user.set(userObj)
        .then(() => {
          authCallback(undefined, userObj)
          redirectToStatus('success')
        })
        .catch((err) => {
          authCallback(err)
          redirectToStatus('error')
        })
      }

      redirectToStatus('error')
    })

    return new Promise.fromCallback((cb) => {
      server = app.listen(0, '127.0.0.1', cb)
    })
  }

  return Promise.resolve()
}

const _stopServer = () => {
  debug('Closing auth server')
  if (server) {
    server.close()
    server = undefined
  }

  app = undefined
  authState = undefined
  authCallback = undefined
}

const _launchNativeAuth = (loginUrl) => {
  // wrap openExternal here in case `electron.shell` is not available (during tests)
  return Promise.fromCallback((cb) => {
    shell.openExternal(loginUrl, {}, cb)
  })
}

const _launchElectronAuth = (loginUrl) => {
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
  _buildFullLoginUrl,
  _getOriginFromUrl,
  _launchServer,
  _launchElectronAuth,
  _launchNativeAuth,
  _stopServer,
  start,
}
