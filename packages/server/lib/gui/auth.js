const _ = require('lodash')
const debug = require('debug')('cypress:server:auth')
const express = require('express')
const Promise = require('bluebird')
const { shell } = require('electron')
const url = require('url')

const errors = require('../errors')
const random = require('../util/random')
const user = require('../user')
const windows = require('./windows')

let app
let authCallback
let authState
let openExternalAttempted = false
let authRedirectReached = false
let server

const _buildLoginRedirectUrl = (server) => {
  const { port } = server.address()

  return `http://127.0.0.1:${port}/redirect-to-auth`
}

const _buildFullLoginUrl = (baseLoginUrl, server) => {
  const { port } = server.address()

  if (!authState) {
    authState = random.id(32)
  }

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
const start = (onWarning) => {
  authRedirectReached = false

  return user.getBaseLoginUrl()
  .then(_launchServer)
  .then(() => {
    return _buildLoginRedirectUrl(server)
  })
  .then((loginRedirectUrl) => {
    debug('Trying to open native auth to URL ', loginRedirectUrl)

    return _launchNativeAuth(loginRedirectUrl, onWarning)
    .then(() => {
      debug('openExternal completed')
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

    app.get('/redirect-to-auth', (req, res) => {
      authRedirectReached = true

      const fullLoginUrl = _buildFullLoginUrl(baseLoginUrl, server)

      debug('Received GET to /redirect-to-auth, redirecting: %o', { fullLoginUrl })

      res.redirect(303, fullLoginUrl)
    })

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
  openExternalAttempted = false
  authRedirectReached = false
}

const _launchNativeAuth = (loginUrl, onWarning) => {
  const warnCouldNotLaunch = () => {
    if (openExternalAttempted && !authRedirectReached) {
      onWarning(errors.get('AUTH_COULD_NOT_LAUNCH_BROWSER', loginUrl))
    }
  }

  warnCouldNotLaunch()

  setTimeout(warnCouldNotLaunch, 10000)

  openExternalAttempted = true

  // wrap openExternal here in case `electron.shell` is not available (during tests)
  return Promise.fromCallback((cb) => {
    shell.openExternal(loginUrl, {}, cb)
  })
  .catch((err) => {
    debug('Error launching native auth: %o', { err })
    warnCouldNotLaunch()
  })
}

module.exports = {
  _buildFullLoginUrl,
  _getOriginFromUrl,
  _launchServer,
  _launchNativeAuth,
  _stopServer,
  start,
}
