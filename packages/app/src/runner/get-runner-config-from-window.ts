import { decodeBase64Unicode } from '@packages/frontend-shared/src/utils/base64'

export function getRunnerConfigFromWindow () {
  // @ts-ignore
  return JSON.parse(decodeBase64Unicode(window.__CYPRESS_CONFIG__?.base64Config)) as Cypress.Config
}
