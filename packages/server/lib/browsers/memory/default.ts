import debugModule from 'debug'
import os from 'os'
import si from 'systeminformation'

const debugVerbose = debugModule('cypress-verbose:server:browsers:memory:default')

const getTotalMemoryLimit = async () => {
  const limit = os.totalmem()

  debugVerbose('total memory limit', limit)

  return limit
}

const getAvailableMemory = async (totalMemoryLimit: number, log?: { [key: string]: any }) => {
  const available = (await si.mem()).available

  debugVerbose('memory available', available)

  return available
}

export default {
  getTotalMemoryLimit,
  getAvailableMemory,
}
