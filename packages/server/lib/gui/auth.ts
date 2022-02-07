const _ = require('lodash')
const debug = require('debug')('cypress:server:auth')
const express = require('express')
const os = require('os')
const pkg = require('@packages/root')
const Promise = require('bluebird')
const { shell } = require('electron')
const url = require('url')

const errors = require('../errors')
const machineId = require('../util/machine_id')
const random = require('../util/random')
const user = require('../user')

let app
let authCallback
let authState
let openExternalAttempted = false
let authRedirectReached = false
let server

const buildLoginRedirectUrl = (server) => {
  const { port } = server.address()

  return `http://127.0.0.1:${port}/redirect-to-auth`
}

const buildFullLoginUrl = (baseLoginUrl, server, utmCode) => {
  const { port } = server.address()

  if (!authState) {
    authState = random.id(32)
  }

  const authUrl = url.parse(baseLoginUrl)

  return machineId.machineId()
  .then((id) => {
    authUrl.query = {
      port,
      state: authState,
      machineId: id,
      cypressVersion: pkg.version,
      platform: os.platform(),
    }

    if (utmCode) {
      authUrl.query = {
        utm_source: 'Test Runner',
        utm_medium: utmCode,
        utm_campaign: 'Log In',
        ...authUrl.query,
      }
    }

    return authUrl.format()
  })
}

const getOriginFromUrl = (originalUrl) => {
  const parsedUrl = url.parse(originalUrl)

  return url.format(_.pick(parsedUrl, ['protocol', 'slashes', 'hostname', 'port']))
}

/**
 * @returns the currently running auth server instance, launches one if there is not one
 */
const launchServer = (baseLoginUrl, sendMessage, utmCode) => {
  if (!server) {
    // launch an express server to listen for the auth callback from dashboard
    const origin = getOriginFromUrl(baseLoginUrl)

    debug('Launching auth server with origin', origin)
    app = express()

    app.get('/redirect-to-auth', (req, res) => {
      authRedirectReached = true

      buildFullLoginUrl(baseLoginUrl, server, utmCode)
      .then((fullLoginUrl) => {
        debug('Received GET to /redirect-to-auth, redirecting: %o', { fullLoginUrl })

        res.redirect(303, fullLoginUrl)

        sendMessage('info', 'AUTH_BROWSER_LAUNCHED')
      })
    })

    app.get('/auth', (req, res) => {
      debug('Received GET to /auth with query params %o', req.query)

      const redirectToStatus = (status) => {
        res.redirect(`${baseLoginUrl}?status=${status}`)
      }

      /**
       * Cypress Dashboard can redirect to us with an error; or, if Electron's shell.openExternal
       * is bugging out, `authCallback` can be undefined and reaching this point makes no sense.
       * @see https://github.com/cypress-io/cypress/pull/5243
       */
      if (_.get(req.query, 'status') === 'error' || !authCallback) {
        if (authCallback) {
          authCallback(new Error('There was an error authenticating to the Cypress dashboard.'))
        }

        return redirectToStatus('error')
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

const stopServer = () => {
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

const launchNativeAuth = Promise.method((loginUrl, sendMessage) => {
  const warnCouldNotLaunch = () => {
    if (openExternalAttempted && !authRedirectReached) {
      sendMessage('warning', 'AUTH_COULD_NOT_LAUNCH_BROWSER', loginUrl)
    }
  }

  warnCouldNotLaunch()

  setTimeout(warnCouldNotLaunch, 4000)

  openExternalAttempted = true

  return shell.openExternal(loginUrl)
  .catch((err) => {
    debug('Error launching native auth: %o', { err })
    warnCouldNotLaunch()
  })
})

/**
 * Grouping internal APIs under separate export to allow for stubbing
 * in public API tests.
 */
const _internal = {
  buildLoginRedirectUrl,
  buildFullLoginUrl,
  getOriginFromUrl,
  launchServer,
  stopServer,
  launchNativeAuth,
}

/**
 * @returns a promise that is resolved with a user when auth is complete or rejected when it fails
 */
const start = (onMessage, utmCode, onLogin) => {
  function sendMessage (type, name, arg1) {
    onMessage({
      type,
      name,
      message: errors.getMsgByType(name, arg1),
      browserOpened: authRedirectReached,
    })
  }

  authRedirectReached = false

  return user.getBaseLoginUrl()
  .then((baseLoginUrl) => {
    return _internal.launchServer(baseLoginUrl, sendMessage, utmCode)
  })
  .then(() => {
    return _internal.buildLoginRedirectUrl(server)
  })
  .then((loginRedirectUrl) => {
    debug('Trying to open native auth to URL %s', loginRedirectUrl)

    return _internal.launchNativeAuth(loginRedirectUrl, sendMessage)
    .then(() => {
      debug('successfully opened native auth url')
    })
  })
  .then(() => {
    return Promise.fromCallback((cb) => {
      authCallback = cb
    })
  })
  .finally(() => {
    _internal.stopServer()
    onLogin()
  })
}

export = {
  start,
  _internal,
}
