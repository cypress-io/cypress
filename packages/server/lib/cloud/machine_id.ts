import nmi from 'node-machine-id'

export function machineId () {
  return nmi.machineId()
  .catch(() => {
    return null
  })
}
