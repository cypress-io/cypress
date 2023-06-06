import _ from 'lodash'
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
  args: any[]
}

type NonSpecError = Error & { isNonSpec: boolean | undefined }
type ChannelUrl = string
type ChannelKey = string

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
    const specScripts = JSON.stringify(options.scripts.map(({ relativeUrl }) => relativeUrl))

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
  extractVerifiedCommand (command) {
    const matchingIndex = _.findIndex(this.verifiedCommands, ({ name, args }) => {
      return command.name === name && _.isEqual(command.args, _.dropRightWhile(args, _.isUndefined))
    })

    // since we're now running this command, remove it from the list of
    // verified commands
    this.verifiedCommands = this.verifiedCommands.splice(matchingIndex, 1)

    return this.verifiedCommands[matchingIndex]
  }

  runPrivilegedCommand (config, { commandName, options, userArgs }) {
    // the presence of the command within the verifiedCommands array indicates
    // the command being run is verified. it also removes the command from the
    // array, since it's no longer needed there after it's run
    const matchingCommand = this.extractVerifiedCommand({ name: commandName, args: userArgs })

    if (!matchingCommand) {
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
