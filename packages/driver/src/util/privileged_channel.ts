import Bluebird from 'bluebird'
import { extname } from 'path'

import $errUtils from '../cypress/error_utils'

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

type PrivilegedCy = Pick<Cypress.cy, 'state'>
type PrivilegedCommandCypress = Pick<InternalCypress.Cypress, 'backend'>
type PrivilegedFileCommandCypress = Pick<InternalCypress.Cypress, 'backend' | 'config'> & {
  Buffer: {
    from: (value: ArrayBuffer) => Buffer
  }
}
type PrivilegedVerification = {
  args?: unknown[]
  promise?: Promise<unknown>
}
interface JsonObject {
  [key: string]: JsonValue
}

type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject
type DecodedPrivilegedFileContents = Buffer | JsonValue
type PrivilegedFileCommandResult = {
  contents: DecodedPrivilegedFileContents
  filePath: string
}
type PrivilegedFileRead = {
  filePath: string
  token: string
}

interface RunPrivilegedCommandOptions {
  commandName: string
  cy: PrivilegedCy
  Cypress: PrivilegedCommandCypress
  options: any
}

interface RunPrivilegedFileCommandOptions {
  commandName: 'readFile' | 'selectFile'
  cy: PrivilegedCy
  Cypress: PrivilegedFileCommandCypress
  options: {
    encoding?: Cypress.Encodings | null
    file: string
  }
}

const getVerifiedCommand = (cy: PrivilegedCy): PrivilegedVerification => {
  const privilegeVerification = cy.state('current')?.get('privilegeVerification')

  return (Array.isArray(privilegeVerification) ? privilegeVerification[0] : undefined) ?? {}
}

const getPrivilegedFileReadUrl = (
  Cypress: RunPrivilegedFileCommandOptions['Cypress'],
) => {
  return `${window.location.origin}/${String(Cypress.config('namespace'))}/privileged-commands/read-file`
}

const readResponseAsArrayBuffer = async (response: Response) => {
  const { body } = response

  if (!body) return response.arrayBuffer()

  // Reassemble the streamed response body without relying on a single
  // monolithic payload transfer.
  const reader = body.getReader()
  const chunks: Uint8Array[] = []
  let totalLength = 0

  for (let result = await reader.read(); !result.done; result = await reader.read()) {
    const { value } = result

    if (value) {
      chunks.push(value)
      totalLength += value.byteLength
    }
  }

  const combined = new Uint8Array(totalLength)
  let offset = 0

  chunks.forEach((chunk) => {
    combined.set(chunk, offset)
    offset += chunk.byteLength
  })

  return combined.buffer
}

const throwResponseError = async (response: Response) => {
  const defaultError = new Error(
    `Privileged file read failed with status code ${response.status}`,
  )
  const body = await response.json().catch(() => undefined)

  if (body?.error) throw $errUtils.makeErrFromObj(body.error)

  throw defaultError
}

const stripJsonByteOrderMark = (contents: string) => {
  return contents.replace(/^\uFEFF/, '')
}

const decodePrivilegedFileContents = (
  Cypress: RunPrivilegedFileCommandOptions['Cypress'],
  arrayBuffer: ArrayBuffer,
  {
    encoding,
    file,
    filePath,
  }: {
    encoding?: Cypress.Encodings | null
    file: string
    filePath: string
  },
): DecodedPrivilegedFileContents => {
  const buffer = Cypress.Buffer.from(arrayBuffer)

  if (encoding === null) return buffer

  const stringContents = buffer.toString(encoding ?? 'utf8')

  if (extname(filePath || file) === '.json') {
    try {
      return JSON.parse(stripJsonByteOrderMark(stringContents))
    } catch (error) {
      error.filePath = filePath
      error.originalFilePath = file

      throw error
    }
  }

  return stringContents
}

export function runPrivilegedCommand ({ commandName, cy, Cypress, options }: RunPrivilegedCommandOptions): Bluebird<any> {
  const { args, promise } = getVerifiedCommand(cy)

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

export function runPrivilegedFileCommand ({
  commandName,
  cy,
  Cypress,
  options,
}: RunPrivilegedFileCommandOptions): Bluebird<PrivilegedFileCommandResult> {
  const { args, promise } = getVerifiedCommand(cy)

  return Bluebird
  .try(() => promise)
  .then(async () => {
    const fileRead: PrivilegedFileRead = await Cypress.backend(
      'create:privileged:file:read',
      {
        args,
        commandName,
        options: {
          file: options.file,
        },
      },
    )

    const response = await fetch(
      getPrivilegedFileReadUrl(Cypress),
      {
        body: JSON.stringify({ token: fileRead.token }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      },
    )

    if (!response.ok) await throwResponseError(response)

    const encodedFilePath = response.headers.get('x-cypress-file-path')
    const filePath = encodedFilePath
      ? decodeURIComponent(encodedFilePath)
      : fileRead.filePath
    const contents = decodePrivilegedFileContents(
      Cypress,
      await readResponseAsArrayBuffer(response),
      { encoding: options.encoding, file: options.file, filePath },
    )

    return {
      contents,
      filePath,
    }
  })
}
