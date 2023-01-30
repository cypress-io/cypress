import os from 'os'
import si from 'systeminformation'

/**
 * Returns the total memory limit in bytes.
 * @returns total memory limit in bytes
 */
const getTotalMemoryLimit = async () => {
  return os.totalmem()
}

/**
 * Returns the available memory in bytes.
 * @param totalMemoryLimit total memory limit in bytes
 * @param log optional object to add any additional information
 * @returns available memory in bytes
 */
const getAvailableMemory = async (totalMemoryLimit: number, log?: { [key: string]: any }) => {
  return (await si.mem()).available
}

export default {
  getTotalMemoryLimit,
  getAvailableMemory,
}
