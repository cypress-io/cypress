import _ from 'lodash'
import path from 'path'
import { createHash, randomUUID } from 'crypto'

import * as exec from '../exec'
import * as files from '../files'
import { fs } from '../util/fs'
import * as task from '../task'
import { getUserDefinedEnvironmentVariables } from '../getUserDefinedEnvs'
import { serializeForInlineScript } from '@packages/network-tools'
import { encodeEventParts } from '@packages/socket'

interface SpecOriginatedCommand {
  name: string
  hash: string
}

type NonSpecError = Error & { isNonSpec: boolean | undefined }
type ChannelUrl = string
type ChannelKey = string

const sha256 = (data: string | Uint8Array) => {
  return createHash('sha256').update(data).digest('hex')
}

const toBytes = (binary: ArrayBuffer | ArrayBufferView) => {
  return ArrayBuffer.isView(binary) ? new Uint8Array(binary.buffer, binary.byteOffset, binary.byteLength) : new Uint8Array(binary)
}

// the driver verifies the same encoding of the options it sends (see encodeOptionsAsSent)
const hashOptions = (options: unknown) => {
  const [packet, ...binaries] = encodeEventParts(options ?? null)
  const binaryHashes = binaries.map((binary) => sha256(toBytes(binary)))

  return sha256(JSON.stringify([packet, binaryHashes]))
}

const getOrigin = (url: string) => {
  try {
    return new URL(url).origin
  } catch {
    return undefined
  }
}

class PrivilegedCommandsManager {
  channelKeys: Record<ChannelUrl, ChannelKey> = {}
  verifiedCommands: SpecOriginatedCommand[] = []
  specBridgeOrigins = new Set<string>()

  async getPrivilegedChannel (options: {
    isSpecBridge: boolean
    url: string
    scripts: { relativeUrl: string }[]
    browserFamily: string
    namespace: string
    documentDomainContext: boolean
  }) {
    // setting up a non-spec bridge channel means the beginning of running
    // a spec and is a signal that we should reset state
    if (!options.isSpecBridge) {
      this.reset()
    }

    // a spec bridge only needs a channel for an origin the spec passed to a
    // verified cy.origin(), and only one per origin
    const url = options.isSpecBridge ? getOrigin(options.url) : options.url

    if (!url || this.channelKeys[url]) return

    if (options.isSpecBridge && !this.specBridgeOrigins.has(url)) return

    const key = randomUUID()

    this.channelKeys[url] = key

    const script = (await fs.readFileAsync(path.join(__dirname, 'privileged-channel.js'))).toString()
    const specScripts = JSON.stringify(options.scripts.map(({ relativeUrl }) => relativeUrl))

    return `${script}({
      browserFamily: ${serializeForInlineScript(options.browserFamily)},
      isSpecBridge: ${serializeForInlineScript(!!options.isSpecBridge)},
      key: ${serializeForInlineScript(key)},
      namespace: ${serializeForInlineScript(options.namespace)},
      scripts: ${serializeForInlineScript(specScripts)},
      url: ${serializeForInlineScript(url)},
      documentDomainContext: ${serializeForInlineScript(!!options.documentDomainContext)},
    })`
  }

  addVerifiedCommand ({ hash, name, key, url }, requestOrigin: string | undefined) {
    // if the key isn't valid, don't add it as a verified command. once the
    // command attempts to run, it will fail at that point
    if (typeof key !== 'string' || key !== this.channelKeys[url]) return

    // the channel posts from the origin of the document it was issued to
    const origin = getOrigin(url)

    if (!origin || origin !== requestOrigin) return

    this.verifiedCommands.push({ name, hash })
  }

  // removes and reports the matching verified command, so each verification
  // allows the command to run once
  consumeVerifiedCommand (command: SpecOriginatedCommand) {
    const index = _.findIndex(this.verifiedCommands, ({ name, hash }) => {
      return command.name === name && command.hash === hash
    })

    if (index === -1) return false

    this.verifiedCommands.splice(index, 1)

    return true
  }

  runPrivilegedCommand (config, { commandName, options }) {
    const hasCommand = this.consumeVerifiedCommand({ name: commandName, hash: hashOptions(options) })

    if (config.testingType === 'e2e' && !hasCommand) {
      // this error message doesn't really matter as each command will catch it
      // in the driver based on err.isNonSpec and throw a different error
      const err = new Error(`cy.${commandName}() must be invoked from the spec file or support file`) as NonSpecError

      err.isNonSpec = true

      throw err
    }

    switch (commandName) {
      case 'env':
        return getUserDefinedEnvironmentVariables({ requestedKeys: options.envVars, userDefinedEnvironmentVariables: config.env || {} })
      case 'exec':
        return exec.run()
      case 'origin':
        this.specBridgeOrigins.add(options.specBridgeOrigin)

        return
      case 'readFile':
        return files.readFile(config.projectRoot, options)
      case 'selectFile':
        return files.readFiles(config.projectRoot, options)
      case 'writeFile':
        return files.writeFile(config.projectRoot, options)
      case 'task': {
        const configFile = config.configFile && config.configFile.includes(config.projectRoot)
          ? config.configFile
          : path.join(config.projectRoot, config.configFile)

        return task.run(configFile ?? null, options)
      }
      default:
        throw new Error(`You requested a secure backend event for a command we cannot handle: ${commandName}`)
    }
  }

  reset () {
    this.channelKeys = {}
    this.verifiedCommands = []
    this.specBridgeOrigins.clear()
  }
}

export const privilegedCommandsManager = new PrivilegedCommandsManager()
