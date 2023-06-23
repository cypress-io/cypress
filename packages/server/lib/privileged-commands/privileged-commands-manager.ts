import _ from 'lodash'
import os from 'os'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

import exec from '../exec'
import files from '../files'
import { fs } from '../util/fs'
import task from '../task'

export interface SpecChannelOptions {
  isSpecBridge: boolean
  url: string
  key: string
}

interface SpecOriginatedCommand {
  name: string
  args: string
}

type NonSpecError = Error & { isNonSpec: boolean | undefined }
type ChannelUrl = string
type ChannelKey = string

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

class PrivilegedCommandsManager {
  channelKeys: Record<ChannelUrl, ChannelKey> = {}
  verifiedCommands: SpecOriginatedCommand[] = []

  async getPrivilegedChannel (options) {
    // setting up a non-spec bridge channel means the beginning of running
    // a spec and is a signal that we should reset state
    if (!options.isSpecBridge) {
      this.reset()
    }

    // no-op if already set up for url
    if (this.channelKeys[options.url]) return

    const key = uuidv4()

    this.channelKeys[options.url] = key

    const script = (await fs.readFileAsync(path.join(__dirname, 'privileged-channel.js'))).toString()
    const specScripts = JSON.stringify(options.scripts.map(({ relativeUrl }) => {
      if (os.platform() === 'win32') {
        return relativeUrl.replaceAll('\\', '\\\\')
      }

      return relativeUrl
    }))

    return `${script}({
      browserFamily: '${options.browserFamily}',
      isSpecBridge: ${options.isSpecBridge || 'false'},
      key: '${key}',
      namespace: '${options.namespace}',
      scripts: '${specScripts}',
      url: '${options.url}'
    })`
  }

  addVerifiedCommand ({ args, name, key, url }) {
    // if the key isn't valid, don't add it as a verified command. once the
    // command attempts to run, it will fail at that point
    if (key !== this.channelKeys[url]) return

    this.verifiedCommands.push({ name, args })
  }

  // finds and returns matching command from the verified commands array. it
  // also removes that command from the verified commands array
  hasVerifiedCommand (command) {
    const matchingCommand = _.find(this.verifiedCommands, ({ name, args }) => {
      // undefined values can end up at the end of the args array due to the
      // way it's sent over websockets. need to trim them so that they properly
      // match the original invocation
      const trimmedArgs = _.dropRightWhile(args, _.isUndefined)
      // the args added to `this.verifiedCommands` come hashed (see
      // server/lib/privileged-commands/privileged-channel.js for more info)
      // hash the ones sent with the command we're running for an
      // apples-to-apples comparison
      const hashedArgs = command.args.map((arg) => hash(JSON.stringify(arg)))

      return command.name === name && _.isEqual(trimmedArgs, hashedArgs)
    })

    return !!matchingCommand
  }

  runPrivilegedCommand (config, { commandName, options, userArgs }) {
    // the presence of the command within the verifiedCommands array indicates
    // the command being run is verified
    const hasCommand = this.hasVerifiedCommand({ name: commandName, args: userArgs })

    if (config.testingType === 'e2e' && !hasCommand) {
      // this error message doesn't really matter as each command will catch it
      // in the driver based on err.isNonSpec and throw a different error
      const err = new Error(`cy.${commandName}() must be invoked from the spec file or support file`) as NonSpecError

      err.isNonSpec = true

      throw err
    }

    switch (commandName) {
      case 'exec':
        return exec.run(config.projectRoot, options)
      case 'origin':
        // only need to verify that it's spec-originated above
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
  }
}

export const privilegedCommandsManager = new PrivilegedCommandsManager()
