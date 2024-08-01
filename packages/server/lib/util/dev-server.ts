import isString from 'lodash/isString'
import debugFn from 'debug'

const debug = debugFn('cypress-verbose:server:dev-server')

class PortMismatch extends Error {
  constructor (message: string) {
    super()
    this.message = message
    this.name = 'PortMismatch'
  }
}

export const verifyPortsMatch = (baseUrl: string | null, port: number) => {
  if (!isString(baseUrl)) {
    debug(`Error: baseUrl is not a string. Cannot verify ports match`)
    throw new PortMismatch('baseUrl is not set')
  }

  try {
    const baseURL = new URL(baseUrl)

    const parsedPort = parseInt(baseURL.port)

    if (parsedPort !== port) {
      debug(`Error: baseUrl is expecting port ${parsedPort} but dev-server is running on port ${port}`)

      throw new PortMismatch(`baseUrl is expecting port ${parsedPort} but dev-server is running on port ${port}`)
    }
  } catch (e) {
    // if PortMismatch error above, just rethrow. Otherwise, we want to decorate the error
    if (e instanceof PortMismatch) {
      throw e
    }

    debug(`Error: unable to parse port from expected baseUrl: ${baseUrl}`)

    throw new PortMismatch('unable to parse baseUrl')
  }
}
