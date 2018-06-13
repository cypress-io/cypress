// Credit for most of the code in this file: https://github.com/mozilla/web-ext

const debug = require('debug')('cypress:server:browsers')
const connectToFirefox = require('node-firefox-connect')
const Promise = require('bluebird')

function isErrorWithCode (codeWanted, error) {
  if (Array.isArray(codeWanted) && codeWanted.indexOf(error.code) !== -1) {
    return true
  } else if (error.code === codeWanted) {
    return true
  }

  return false
}

const REMOTE_PORT = 6005

class RemoteFirefox {
  constructor (client) {
    this.client = client
    this.checkedForAddonReloading = false

    client.client.on('disconnect', () => {
      debug('Received "disconnect" from Firefox client')
    })
    client.client.on('end', () => {
      debug('Received "end" from Firefox client')
    })
    client.client.on('message', (info) => {
      // These are arbitrary messages that the client library ignores.
      debug(`Received message from client: ${JSON.stringify(info)}`)
    })
  }

  disconnect () {
    this.client.disconnect()
  }

  installTemporaryAddon (addonPath) {
    debug('Attempt to install temporary addon', addonPath)
    return new Promise((resolve, reject) => {
      const listTabsTimeout = setTimeout(() => {
        reject('Installing temporary addon (listTabs()) timed out')
      }, 5000)

      this.client.request('listTabs', (error, tabsResponse) => {
        clearTimeout(listTabsTimeout)
        if (error) {
          debug('Error installing temporary addon: listTabs() error:', error)
          // return reject(new WebExtError(`Remote Firefox: listTabs() error: ${error}`))
          return reject(new Error(`Remote Firefox: listTabs() error: ${error}`))
        }
        if (!tabsResponse.addonsActor) {
          debug(
            'listTabs returned a falsey addonsActor: ' +
            `${tabsResponse.addonsActor}`)
          // return reject(new RemoteTempInstallNotSupported(
          //   'This is an older version of Firefox that does not provide an ' +
          //   'add-ons actor for remote installation. Try Firefox 49 or ' +
          //   'higher.'))
          return reject(new Error(
            'This is an older version of Firefox that does not provide an ' +
            'add-ons actor for remote installation. Try Firefox 49 or ' +
            'higher.'))
        }

        const installTimeout = setTimeout(() => {
          reject('Installing temporary addon timed out')
        }, 5000)

        debug('make installTemporaryAddon request')
        this.client.client.makeRequest({
          to: tabsResponse.addonsActor,
          type: 'installTemporaryAddon',
          addonPath,
        }, (installResponse) => {
          clearTimeout(installTimeout)
          if (installResponse.error) {
            // return reject(new WebExtError(
            //   'installTemporaryAddon: Error: ' +
            //   `${installResponse.error}: ${installResponse.message}`))
            return reject(new Error(
              'installTemporaryAddon: Error: ' +
              `${installResponse.error}: ${installResponse.message}`))
          }
          debug(`installTemporaryAddon: ${JSON.stringify(installResponse)}`)
          debug(`Installed ${addonPath} as a temporary add-on`)
          resolve(installResponse)
        })
      })
    })
  }

  acceptInsecureCerts () {
    return new Promise((resolve, reject) => {
      //// this is supposed to return info about the protocol
      // debug('make protocolDescription request')
      // this.client.client.makeRequest({
      //   to: 'root',
      //   type: 'protocolDescription',
      // }, (response) => {
      //   debug('receive response', response)
      //   debug('methods:', response.types.addons.methods)
      //   if (response.error) {
      //     reject(new Error(`${response.error}: ${response.message}`))
      //   } else {
      //     resolve()
      //   }
      // })
      //// need to figure out the right type and format for the capability
      debug('make acceptInsecureCerts request')
      this.client.client.makeRequest({
        to: 'root',
        type: '???',
        capabilities: { alwaysMatch: { acceptInsecureCerts: true } },
      }, (response) => {
        debug('receive response', response)
        if (response.error) {
          reject(new Error(`${response.error}: ${response.message}`))
        } else {
          resolve()
        }
      })
    })
  }
}


function findRemotePort () {
  debug('Find remote port')
  let retriesLeft = 10

  function tryPort (port) {
    debug(`Try remote port ${port}`)
    return connect(port)
    .then((client) => {
      debug(`Remote Firefox port ${port} is in use ` +
                `(retries remaining: ${retriesLeft})`)
      retriesLeft--
      port++
      client.disconnect()

      if (!retriesLeft) {
        // throw new WebExtError('Too many retries on port search');
        throw new Error('Too many retries on port search')
      }

      return tryPort(port)
    })
    .catch((error) => {
      if (isErrorWithCode('ECONNREFUSED', error)) {
        debug(`Got remote port ${port} for firefox`)
        // The connection was refused so this port is good to use.
        return port
      }

      throw error
    })
  }

  return tryPort(REMOTE_PORT)
}

function connect (port = REMOTE_PORT) {
  debug(`Connecting to Firefox on port ${port}`)
  return Promise.try(() => connectToFirefox(port)).then((client) => {
    debug(`Connected to the remote Firefox debugger on port ${port}`)
    return new RemoteFirefox(client)
  })
}


function connectWithMaxRetries (port = REMOTE_PORT) {
  const maxRetries = 50
  const retryInterval = 120
  let retries = 0

  function establishConnection () {
    return connect(port)
    .catch((error) => {
      if (isErrorWithCode('ECONNREFUSED', error)) {
        retries++
        if (retries > maxRetries) {
          debug('Connect to Firefox debugger: too many retries')
          throw error
        }

        return new Promise((resolve) => {
          debug(`wait ${retryInterval}ms before retrying...`)
          setTimeout(resolve, retryInterval)
        }).then(() => {
          debug(`Retrying Firefox (${retries}) connection error: ${error}`)
          return establishConnection().tap(() => {
            retries = 0
          })
        })
      } else {
        console.error(error.stack) // eslint-disable-line no-console
        throw error
      }
    })
  }

  debug('Connecting to the remote Firefox debugger...')
  return establishConnection()
}

module.exports = {
  connect: connectWithMaxRetries,
  findRemotePort,
  REMOTE_PORT,
}
