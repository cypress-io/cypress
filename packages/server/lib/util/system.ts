import os from 'os'
import Bluebird from 'bluebird'
import getos from 'getos'

type GetOsResult = {
  os: string
  dist: string
  codename: string
  release: string
}

const getOs = Bluebird.promisify<GetOsResult>(getos)

const getOsVersion = async (): Promise<string> => {
  if (os.platform() === 'linux') {
    try {
      const obj = await getOs()

      return [obj.dist, obj.release].join(' - ')
    } catch (err) {
      return os.release()
    }
  }

  return os.release()
}

export const info = (): Promise<SystemInfo> => {
  return getOsVersion()
  .then((osVersion) => {
    return {
      osName: os.platform(),
      osVersion,
      osCpus: os.cpus(),
      osMemory: {
        free: os.freemem(),
        total: os.totalmem(),
      },
    }
  })
}

export type SystemInfo = {
  osName: NodeJS.Platform
  osVersion: string
  osCpus: os.CpuInfo[]
  osMemory: {
    free: number
    total: number
  }
}
