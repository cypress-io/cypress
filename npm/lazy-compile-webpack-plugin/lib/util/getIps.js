const os = require('os')
const ifaces = os.networkInterfaces()

module.exports = function getIps () {
  const ips = []

  Object.keys(ifaces).forEach((ifname) => {
    ifaces[ifname].forEach((iface) => {
      if ('IPv4' !== iface.family || iface.internal !== false) {
        return
      }

      // Check if the address is a private ip
      // https://en.wikipedia.org/wiki/Private_network#Private_IPv4_address_spaces
      if (
        /^10[.]|^172[.](1[6-9]|2[0-9]|3[0-1])[.]|^192[.]168[.]/.test(
          iface.address,
        )
      ) {
        ips.push(iface.address)
      }
    })
  })

  return ips
}
