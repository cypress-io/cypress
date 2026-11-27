import Bluebird from 'bluebird'
import { encodeEventParts } from '@packages/socket/browser/utils'

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

const toBytes = async (binary: ArrayBuffer | ArrayBufferView | Blob): Promise<Uint8Array> => {
  if (ArrayBuffer.isView(binary)) {
    return new Uint8Array(binary.buffer, binary.byteOffset, binary.byteLength)
  }

  if (binary instanceof Blob) {
    return new Uint8Array(await binary.arrayBuffer())
  }

  return new Uint8Array(binary)
}

/**
 * splits the options into the packet string and binary attachments socket.io
 * sends for them, which the server re-encodes from the options it receives
 */
export async function encodeOptionsAsSent (options: unknown) {
  const [packet, ...binaries] = encodeEventParts(options ?? null)

  return {
    packet,
    binaries: await Promise.all(binaries.map(toBytes)),
  }
}

export function runPrivilegedCommand ({ commandName, cy, Cypress, options }: RunPrivilegedCommandOptions): Bluebird<any> {
  const { verify } = (cy.state('current').get('privilegeVerification') || [])[0] || {}

  return Bluebird
  .try(async () => {
    if (!verify) return

    const { packet, binaries } = await encodeOptionsAsSent(options)

    return verify(packet, binaries)
  })
  .then(() => {
    return Cypress.backend('run:privileged', {
      commandName,
      options,
    })
  })
}
