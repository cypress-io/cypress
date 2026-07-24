import { listLiveInstances } from '../../cypress-instances'
import { renderResult } from '../output'
import type { TapCliCommand, TapCliOptions } from '../types'

const INSTANCES_DETAILS = `Lists the running Cypress instances this CLI can reach, as a JSON array. Pass
an instance's pid to \`--instance\` to target it with another tap command.`

const NO_INSTANCES_GUIDANCE = 'No running Cypress instance found. Start Cypress in open mode (e.g. `cypress open`) and select a testing type to get started.'

const listInstances = async (options: TapCliOptions): Promise<number> => {
  const instances = await listLiveInstances({ instance: options.instance })

  if (instances.length === 0) {
    renderResult(NO_INSTANCES_GUIDANCE)

    return 0
  }

  renderResult(instances.map((instance) => ({
    pid: instance.pid,
    projectRoot: instance.projectRoot,
    testingType: instance.testingType,
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
