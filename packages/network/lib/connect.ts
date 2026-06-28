import { promisify } from 'util'
import debugModule from 'debug'
import dns from 'dns'
import _ from 'lodash'
import net from 'net'
import tls from 'tls'
import os from 'os'

const debug = debugModule('cypress:network:connect')

// RFC 6761 reserves `localhost` and any name ending in `.localhost` for the
// loopback interface, and browsers resolve them accordingly. The OS resolver
// (used by dns.lookup) only special-cases the bare `localhost` label, so
// `*.localhost` virtual hosts fail to resolve here even though they load in the
// browser. https://github.com/cypress-io/cypress/issues/24458
const localhostRe = /(?:^|\.)localhost\.?$/i

export function isLocalhost (hostname: string) {
  return localhostRe.test(hostname)
}

const loopbackAddresses: net.Address[] = [
  { address: '127.0.0.1', family: 4 },
  { address: '::1', family: 6 },
]

export function byPortAndAddress (port: number, address: net.Address) {
  // https://nodejs.org/api/net.html#net_net_connect_port_host_connectlistener
  return new Promise<net.Address>((resolve, reject) => {
    const onConnect = () => {
      client.destroy()
      resolve(address)
    }

    const client = net.connect(port, address.address, onConnect)

    client.on('error', reject)
  })
}

export async function getAddress (port: number, hostname: string): Promise<net.Address> {
  debug('beginning getAddress %o', { hostname, port })

  // promisify at the very last second which enables us to
  // modify dns lookup function (via hosts overrides)
  const lookupAsync = promisify(dns.lookup)

  // this does not go out to the network to figure
  // out the addresses. in fact it respects the /etc/hosts file
  // https://github.com/nodejs/node/blob/dbdbdd4998e163deecefbb1d34cda84f749844a4/lib/dns.js#L108
  // https://nodejs.org/api/dns.html#dns_dns_lookup_hostname_options_callback

  let addresses: dns.LookupAddress[]

  try {
    addresses = await lookupAsync(hostname, { all: true })
  } catch (err) {
    // `localhost` and `*.localhost` are reserved for loopback per RFC 6761, but
    // the OS resolver only handles the bare `localhost` label, so fall back to
    // loopback to match how the browser resolves these names. Any user override
    // (via the `hosts` config or /etc/hosts) is honored above since it makes the
    // lookup succeed. https://github.com/cypress-io/cypress/issues/24458
    if (!isLocalhost(hostname)) {
      throw err
    }

    debug('lookup failed for localhost address, falling back to loopback %o', { hostname, port, err })
    addresses = _.cloneDeep(loopbackAddresses)
  }

  debug('got addresses %o', { hostname, port, addresses })

  // ipv6 addresses are causing problems with cypress in cypress internal e2e tests
  // on windows, so we are filtering them out here
  if (process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF_PARENT_PROJECT && os.platform() === 'win32') {
    debug('filtering ipv6 addresses %o', { hostname, port, addresses })
    addresses = addresses.filter((address) => {
      return address.family === 4
    })
  }

  try {
    const address = await Promise.any(addresses.map((address) => {
      return byPortAndAddress(port, address as net.Address)
    }))

    return address
  } catch (error) {
    debug('error getting address %o', { hostname, port, error })

    throw error
  }
}

// A drop-in for `dns.lookup` that resolves `localhost`/`*.localhost` to loopback
// when the OS resolver can't, so virtual hosts that load in the browser also
// load through Cypress' proxy. Passed as the `lookup` option when establishing a
// connection. `dns.lookup` is referenced at call time so any `hosts`/evilDns
// override is honored first. https://github.com/cypress-io/cypress/issues/24458
export const lookup: net.LookupFunction = (hostname: string, options: any, callback?: any) => {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  return dns.lookup(hostname, options, (err, ...results) => {
    if (err && isLocalhost(hostname)) {
      debug('connection lookup failed for localhost address, falling back to loopback %o', { hostname, options, err })

      if (options.all) {
        return callback(null, _.cloneDeep(loopbackAddresses))
      }

      const family = options.family === 6 ? 6 : 4

      return callback(null, family === 6 ? '::1' : '127.0.0.1', family)
    }

    return callback(err, ...results)
  })
}

export function getDelayForRetry (iteration: number) {
  return [0, 100, 200, 200][iteration]
}

export interface RetryingOptions {
  family: 4 | 6 | 0
  port: number
  host: string | undefined
  useTls: boolean
  getDelayMsForRetry: (iteration: number, err: Error | undefined) => number | undefined
}

function createSocket (opts: RetryingOptions, onConnect: () => void): net.Socket {
  const netOpts = _.defaults(_.pick(opts, 'family', 'host', 'port'), {
    family: 4,
  })

  if (opts.useTls) {
    return tls.connect(netOpts, onConnect)
  }

  return net.connect(netOpts, onConnect)
}

export function createRetryingSocket (
  opts: RetryingOptions,
  cb: (err?: Error, sock?: net.Socket, retry?: (err?: Error) => void) => void,
) {
  if (typeof opts.getDelayMsForRetry === 'undefined') {
    opts.getDelayMsForRetry = getDelayForRetry
  }

  function tryConnect (iteration = 0) {
    const retry = (err: Error | undefined) => {
      const delay = opts.getDelayMsForRetry(iteration, err)

      if (typeof delay === 'undefined') {
        debug('retries exhausted, bubbling up error %o', { iteration, err })

        return cb(err)
      }

      debug('received error on connect, retrying %o', { iteration, delay, err })

      setTimeout(() => {
        tryConnect(iteration + 1)
      }, delay)
    }

    function onError (err: Error) {
      sock.on('error', (err) => {
        debug('second error received on retried socket %o', { opts, iteration, err })
      })

      retry(err)
    }

    function onConnect () {
      debug('successfully connected %o', { opts, iteration })
      // connection successfully established, pass control of errors/retries to consuming function
      sock.removeListener('error', onError)

      cb(undefined, sock, retry)
    }

    const sock = createSocket(opts, onConnect)

    sock.once('error', onError)
  }

  tryConnect()
}
