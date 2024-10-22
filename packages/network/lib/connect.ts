import Bluebird from 'bluebird'
import debugModule from 'debug'
import dns, { LookupAddress, LookupAllOptions } from 'dns'
import _ from 'lodash'
import net from 'net'
import tls from 'tls'

const debug = debugModule('cypress:network:connect')

export function byPortAndAddress (port: number, address: net.Address) {
  // https://nodejs.org/api/net.html#net_net_connect_port_host_connectlistener
  return new Bluebird<net.Address>((resolve, reject) => {
    const onConnect = () => {
      client.destroy()
      resolve(address)
    }

    const client = net.connect(port, address.address, onConnect)

    client.on('error', reject)
  })
}

export function getAddress (port: number, hostname: string): Bluebird<net.Address> {
  debug('beginning getAddress %o', { hostname, port })

  const fn = byPortAndAddress.bind({}, port)

  // promisify at the very last second which enables us to
  // modify dns lookup function (via hosts overrides)
  const lookupAsync = Bluebird.promisify<LookupAddress[], string, LookupAllOptions>(dns.lookup, { context: dns })

  // this does not go out to the network to figure
  // out the addresses. in fact it respects the /etc/hosts file
  // https://github.com/nodejs/node/blob/dbdbdd4998e163deecefbb1d34cda84f749844a4/lib/dns.js#L108
  // https://nodejs.org/api/dns.html#dns_dns_lookup_hostname_options_callback
  // @ts-ignore
  return lookupAsync(hostname, { all: true })
  .then((addresses) => {
    debug('got addresses %o', { hostname, port, addresses })

    // ipv6 addresses are causing problems with cypress in cypress internal e2e tests
    // so we are filtering them out here
    if (process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF_PARENT_PROJECT) {
      debug('filtering ipv6 addresses %o', { hostname, port, addresses })
      addresses = addresses.filter((address) => {
        return address.family === 4
      })
    }

    // convert to an array if string
    return Array.prototype.concat.call(addresses).map(fn)
  })
  .tapCatch((err) => {
    debug('error getting address %o', { hostname, port, err })
  })
  .any()
}

export function getDelayForRetry (iteration) {
  return [0, 100, 200, 200][iteration]
}

export interface RetryingOptions {
  family: 4 | 6 | 0
  port: number
  host: string | undefined
  useTls: boolean
  getDelayMsForRetry: (iteration: number, err: Error) => number | undefined
}

function createSocket (opts: RetryingOptions, onConnect): net.Socket {
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
    const retry = (err) => {
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

    function onError (err) {
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
