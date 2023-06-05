import Bluebird from 'bluebird'

/**
 * prevents further scripts outside of our own and the spec itself from being
 * run in the spec frame
 * @param specWindow: Window
 */
export function setSpecContentSecurityPolicy (specWindow) {
  const metaEl = specWindow.document.createElement('meta')

  metaEl.setAttribute('http-equiv', 'Content-Security-Policy')
  metaEl.setAttribute('content', `script-src 'unsafe-eval'`)
  // TODO: change to this and maybe catch and throw a different error?
  // metaEl.setAttribute('content', `script-src 'none'`)
  specWindow.document.querySelector('head')!.appendChild(metaEl)
}

interface RunPrivilegedCommandOptions {
  commandName: string
  cy: Cypress.cy
  Cypress: InternalCypress.Cypress
  options: any
  userArgs: any[]
}

export function runPrivilegedCommand ({ commandName, cy, Cypress, options, userArgs }: RunPrivilegedCommandOptions): Bluebird<any> {
  return Bluebird.try(() => {
    return cy.state('current').get('verificationPromise')[0]
    // return cy.state('current').get('verificationPromise')
  })
  .then(() => {
    return Cypress.backend('run:privileged', {
      commandName,
      options,
      userArgs,
    })
  })
}
