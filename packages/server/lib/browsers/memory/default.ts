import os from 'os'
import si from 'systeminformation'

const getTotalMemoryLimit = async () => {
  return os.totalmem()
}

const getAvailableMemory = async (totalMemoryLimit: number, log?: { [key: string]: any }) => {
  return (await si.mem()).available
}

export default {
  getTotalMemoryLimit,
  getAvailableMemory,
}
