import { listLiveInstances } from '../../cypress-instances'
import { renderResult } from '../output'
import type { TapCliCommand, TapCliOptions } from '../types'

const INSTANCES_DETAILS = `Lists the running Cypress instances this CLI can reach (those whose tap
binding answers a liveness probe), as a JSON array. Pass a instance's pid to
\`--instance\` to target it with another tap command.`

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

export const instancesCommand: TapCliCommand = {
  name: 'instances',
  description: 'list the running Cypress instances this CLI can reach',
  details: INSTANCES_DETAILS,
  handler: listInstances,
}
