import Bluebird from 'bluebird'

/**
 * prevents further scripts outside of our own and the spec itself from being
 * run in the spec frame
 * @param specWindow: Window
 */
export function setSpecContentSecurityPolicy (specWindow) {
  const metaEl = specWindow.document.createElement('meta')

  metaEl.setAttribute('http-equiv', 'Content-Security-Policy')
  metaEl.setAttribute('content', `script-src 'unsafe-eval'; worker-src * data: blob: 'unsafe-eval' 'unsafe-inline'`)
  specWindow.document.querySelector('head')!.appendChild(metaEl)
}

interface RunPrivilegedCommandOptions {
  commandName: string
  cy: Cypress.cy
  Cypress: InternalCypress.Cypress
  options: any
}

export function runPrivilegedCommand ({ commandName, cy, Cypress, options }: RunPrivilegedCommandOptions): Bluebird<any> {
  const { args, promise } = (cy.state('current').get('privilegeVerification') || [])[0] || {}

  return Bluebird
  .try(() => promise)
  .then(() => {
    return Cypress.backend('run:privileged', {
      commandName,
      options,
      args,
    })
  })
}
