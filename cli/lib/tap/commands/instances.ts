import { listLiveInstances } from '../../cypress-instances'
import { renderOutcome, renderResult } from '../output'
import { defineNativeCommand } from './definition'
import type { TapCliOptions } from '../types'

const NO_INSTANCES_GUIDANCE = 'No running Cypress instance found. Start Cypress in open mode (e.g. `cypress open`) and select a testing type to get started.'

const listInstances = async (options: TapCliOptions): Promise<number> => {
  const instances = await listLiveInstances({ instance: options.instance })

  if (instances.length === 0) {
    renderResult(NO_INSTANCES_GUIDANCE)

    return 0
  }

  renderOutcome('instances', instances.map((instance) => ({
    pid: instance.pid,
    projectRoot: instance.projectRoot,
    testingType: instance.testingType,
    browserAttached: instance.cdpBrowserWsUrl !== null,
  })), options.json)

  return 0
}

export const instancesCommand = defineNativeCommand('instances', listInstances)
