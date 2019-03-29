import * as net from 'net'
import * as dns from 'dns'
import * as Promise from 'bluebird'

export function byPortAndAddress (port: number, address: net.Address) {
  // https://nodejs.org/api/net.html#net_net_connect_port_host_connectlistener
  return new Promise((resolve, reject) => {
    const client = net.connect(port, address.address, () => {
      client.removeListener('error', reject)
      client.end()
      resolve(address)
    })

    client.on('error', reject)
  })
}

export function getAddress (port: number, hostname: string) {
  const fn = byPortAndAddress.bind({}, port)

  // promisify at the very last second which enables us to
  // modify dns lookup function (via hosts overrides)
  const lookupAsync = Promise.promisify(dns.lookup, { context: dns })

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
