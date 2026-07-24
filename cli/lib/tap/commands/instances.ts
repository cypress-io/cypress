import { listLiveInstances } from '../../cypress-instances'
import { renderResult } from '../output'
import { defineNativeCommand } from './definition'
import type { TapCliOptions } from '../types'

const listInstances = async (options: TapCliOptions): Promise<number> => {
  const instances = await listLiveInstances({ instance: options.instance })

  renderResult(instances.map((instance) => ({
    pid: instance.pid,
    projectRoot: instance.projectRoot,
    serverPort: instance.serverPort,
    browserAttached: instance.cdpBrowserWsUrl !== null,
  })))

  return 0
}

export const instancesCommand = defineNativeCommand('instances', listInstances)
