const net = require('net')
const dns = require('dns')
const url = require('url')
const Promise = require('bluebird')

module.exports = {
  byPortAndAddress (port, address) {
    // https://nodejs.org/api/net.html#net_net_connect_port_host_connectlistener
    return new Promise((resolve, reject) => {
      const client = net.connect(port, address.address)

      client.on('connect', () => {
        client.end()

        resolve(address)
      })

      client.on('error', reject)
    })
  },

  getAddress (port, hostname) {
    const fn = this.byPortAndAddress.bind(this, port)

    // promisify at the very last second which enables us to
    // modify dns lookup function (via hosts overrides)
    const lookupAsync = Promise.promisify(dns.lookup, { context: dns })

    // this does not go out to the network to figure
    // out the addresess. in fact it respects the /etc/hosts file
    // https://github.com/nodejs/node/blob/dbdbdd4998e163deecefbb1d34cda84f749844a4/lib/dns.js#L108
    // https://nodejs.org/api/dns.html#dns_dns_lookup_hostname_options_callback
    return lookupAsync(hostname, { all: true })
    .then((addresses) => {
      // convert to an array if string
      return [].concat(addresses).map(fn)
    })
    .any()
  },

  ensureUrl (urlStr) {
    // takes a urlStr and verifies the hostname + port
    let { hostname, protocol, port } = url.parse(urlStr)

    if (port == null) {
      port = protocol === 'https:' ? '443' : '80'
    }

    return this.getAddress(port, hostname)
  },
}
