import { isTapSupportedBrowser, listLiveInstances } from '../../cypress-instances'
import type { LiveInstanceState, ReadyInstanceState } from '../../cypress-instances'
import { renderOutcome, renderResult } from '../output'
import { withTapConnection } from '../tap-connection'
import { FIND_INSTANCE_TIMEOUT_MS, isRendererUnresponsive } from '../cdp-timeout'
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
  /** Display name of the browser the instance has open (e.g. `Chrome`), or `null` when none is open. */
  browserName: string | null
  /** Whether tap can drive the browser the instance has open — tap supports only Chromium based browsers. */
  browserSupported: boolean
  /**
   * Whether the runner page answered. `browserAttached` only says the browser
   * process is reachable, so this is what separates a healthy instance from one
   * whose page is wedged — the state in which every other command fails. Absent
   * when there is no runner page to ask.
   */
  rendererResponsive?: boolean
}

// Bounded, and never throws: `instances` is what a caller reaches for when
// everything else is failing, so an unanswered probe is a reported fact rather
// than an error. Absent means there was nothing to ask, not that it went unasked.
const probeRenderer = async (instance: LiveInstanceState, timeoutMs: number): Promise<boolean | undefined> => {
  if (instance.cdpBrowserWsUrl === null) {
    return undefined
  }

  try {
    return await withTapConnection(instance as ReadyInstanceState, async () => true, timeoutMs)
  } catch (err) {
    return isRendererUnresponsive(err) ? false : undefined
  }
}

const listInstances = async (options: TapCliOptions): Promise<number> => {
  const instances = await listLiveInstances({ instance: options.instance })

  if (instances.length === 0) {
    renderResult(NO_INSTANCES_GUIDANCE)

    return 0
  }

  const timeoutMs = options.timeout ?? FIND_INSTANCE_TIMEOUT_MS
  const responsive = await Promise.all(instances.map((instance) => probeRenderer(instance, timeoutMs)))

  const summaries: TapInstanceSummary[] = instances.map((instance, index) => ({
    pid: instance.pid,
    projectRoot: instance.projectRoot,
    testingType: instance.testingType,
    browserAttached: instance.cdpBrowserWsUrl !== null,
    browserName: instance.browserName,
    browserSupported: isTapSupportedBrowser(instance.browserFamily),
    ...(responsive[index] === undefined ? {} : { rendererResponsive: responsive[index] }),
  }))

  renderOutcome('instances', summaries, options.json)

  return 0
}

export const instancesCommand = defineNativeCommand('instances', listInstances)
