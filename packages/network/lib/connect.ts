import Bluebird from 'bluebird'
import debugModule from 'debug'
import dns from 'dns'
import net from 'net'

const debug = debugModule('cypress:network:connect')

export function byPortAndAddress (port: number, address: net.Address) {
  // https://nodejs.org/api/net.html#net_net_connect_port_host_connectlistener
  return new Bluebird((resolve, reject) => {
    const onConnect = () => {
      client.end()
      resolve(address)
    }

    const client = net.connect(port, address.address, onConnect)

    client.on('error', reject)
  })
}

export function getAddress (port: number, hostname: string) {
  const fn = byPortAndAddress.bind({}, port)

  // promisify at the very last second which enables us to
  // modify dns lookup function (via hosts overrides)
  const lookupAsync = Bluebird.promisify(dns.lookup, { context: dns })

  // this does not go out to the network to figure
  // out the addresess. in fact it respects the /etc/hosts file
  // https://github.com/nodejs/node/blob/dbdbdd4998e163deecefbb1d34cda84f749844a4/lib/dns.js#L108
  // https://nodejs.org/api/dns.html#dns_dns_lookup_hostname_options_callback
  // @ts-ignore
  return lookupAsync(hostname, { all: true })
  .then((addresses: net.Address[]) => {
    // convert to an array if string
    return Array.prototype.concat.call(addresses).map(fn)
  })
  .any()
}

export function getDelayForRetry (iteration, err: Error) {
  return [0, 100, 200, 200][iteration]
}

export function createRetryingSocket (port: number, host: string | undefined, cb: (err?: Error, sock?: net.Socket) => void, getDelayMsForRetryCb?: (iteration: number, err: Error) => number | undefined) {
  if (!getDelayMsForRetryCb) {
    getDelayMsForRetryCb = getDelayForRetry
  }

  function tryConnect(iteration = 0) {
    function onError(err) {
      sock.on("error", (err) => {
        debug("second error received on retried socket %o", { port, host, iteration, err })
      })

      const delay = getDelayForRetry(iteration, err)

      if (typeof delay === 'undefined') {
        debug("retries exhausted, bubbling up error",)
        return cb(err)
      }

      setTimeout(() => {
        tryConnect(iteration + 1)
      }, delay)
    }

    function onConnect() {
      sock.removeListener("error", onError)

      cb(undefined, sock)
    }

    const sock = net.connect({ port, host }, onConnect)
    sock.once("error", onError)
  }

  tryConnect()
}
