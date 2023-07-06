import _ from 'lodash'
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
  specWindow.document.querySelector('head')!.appendChild(metaEl)
}

interface RunPrivilegedCommandOptions {
  commandName: string
  cy: Cypress.cy
  Cypress: InternalCypress.Cypress
  options: any
  userArgs: any[]
}

// hashes a string in the same manner as is in the privileged channel.
// unfortunately this can't be shared because we want to reduce the surface
// area in the privileged channel, which uses closured references to
// globally-accessible functions
// source: https://github.com/bryc/code/blob/d0dac1c607a005679799024ff66166e13601d397/jshash/experimental/cyrb53.js
function hash (str) {
  const seed = 0
  let h1 = 0xdeadbeef ^ seed
  let h2 = 0x41c6ce57 ^ seed

  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507)
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507)
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909)

  return `${4294967296 * (2097151 & h2) + (h1 >>> 0)}`
}

export function runPrivilegedCommand ({ commandName, cy, Cypress, options, userArgs }: RunPrivilegedCommandOptions): Bluebird<any> {
  const hashedArgs = _.dropRightWhile(userArgs || [], _.isUndefined)
  .map((arg) => {
    if (arg === undefined) {
      arg = null
    }

    if (typeof arg === 'function') {
      arg = arg.toString()
    }

    return hash(JSON.stringify(arg))
  })

  return Bluebird.try(() => {
    return cy.state('current').get('verificationPromise')[0]
  })
  .then(() => {
    return Cypress.backend('run:privileged', {
      commandName,
      options,
      userArgs: hashedArgs,
    })
  })
}
