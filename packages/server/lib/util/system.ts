import os from 'os'
import si from 'systeminformation'

const getOsVersion = async () => {
  try {
    const osInfo = await si.osInfo()

    if (osInfo.distro && osInfo.release) {
      return `${osInfo.distro} - ${osInfo.release}`
    }

    return os.release()
  } catch (error) {
    return os.release()
  }
}

export const info = async () => {
  const osVersion = await getOsVersion()

  return {
    osName: os.platform(),
    osVersion,
    osCpus: os.cpus(),
    osMemory: {
      free: os.freemem(),
      total: os.totalmem(),
    },
  }
}
