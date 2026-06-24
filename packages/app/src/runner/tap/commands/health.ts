import { defineCommand } from './definition'

export type HealthResult = 'ok'

export const healthCommand = defineCommand({
  description: 'check that a running Cypress instance is reachable and its tap binding responds',
  params: [],
  handler: async (): Promise<HealthResult> => 'ok',
})
