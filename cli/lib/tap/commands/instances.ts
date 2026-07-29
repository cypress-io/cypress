import { listLiveInstances } from '../../cypress-instances'
import { renderOutcome, renderResult } from '../output'
import { defineNativeCommand } from './definition'
import type { TapCliOptions } from '../types'

const NO_INSTANCES_GUIDANCE = 'No running Cypress instance found. Start Cypress in open mode (e.g. `cypress open`) and select a testing type to get started.'

/** One row of `cypress tap instances`: a reachable open-mode Cypress instance. */
export interface TapInstanceSummary {
  /** Process id — the handle other tap commands accept via `--instance`. */
  pid: number
  /** Absolute path of the project the instance has open. */
  projectRoot: string
  /** Testing type the instance has open, or `null` before one is chosen. */
  testingType: 'e2e' | 'component' | null
  /** Whether the instance has a browser attached over CDP. */
  browserAttached: boolean
}

const listInstances = async (options: TapCliOptions): Promise<number> => {
  const instances = await listLiveInstances({ instance: options.instance })

  if (instances.length === 0) {
    renderResult(NO_INSTANCES_GUIDANCE)

    return 0
  }

  const summaries: TapInstanceSummary[] = instances.map((instance) => ({
    pid: instance.pid,
    projectRoot: instance.projectRoot,
    testingType: instance.testingType,
    browserAttached: instance.cdpBrowserWsUrl !== null,
  }))

  renderOutcome('instances', summaries, options.json)

  return 0
}

export const instancesCommand = defineNativeCommand('instances', listInstances)
