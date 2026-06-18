import os from 'os'
import { machineId } from '../machine_id'

const pkg = require('@packages/root')

/**
 * The standard identity headers sent on cloud requests so the backend can
 * attribute traffic by Cypress version, OS, and machine. The recording-service
 * records these on its Honeycomb request spans.
 *
 * `x-machine-id` resolves to an empty string when the machine id is
 * unavailable, matching the behavior of other cloud requests.
 */
export const getStandardHeaders = async (): Promise<Record<string, string>> => {
  return {
    'x-os-name': os.platform(),
    'x-cypress-version': pkg.version,
    'x-machine-id': await machineId() ?? '',
  }
}
