const nmi = require('node-machine-id')

function machineId () {
  return nmi.machineId()
  .catch(() => {
    return null
  })
}

module.exports = {
  machineId,
}
