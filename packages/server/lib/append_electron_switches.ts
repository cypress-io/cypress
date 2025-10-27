import os from 'os'
import debugModule from 'debug'
import { DEFAULT_ELECTRON_FLAGS } from './util/chromium_flags'

const debug = debugModule('cypress:server:append_electron_switches')

export const appendElectronSwitches = (app: Electron.App) => {
  // NOTE: errors are printed in development mode only
  try {
    // when running inside the electron process, we need to append the default switches immediately
    // before the electron browser is launched. Otherwise, there may be some odd behavior.
    debug('appending default switches for electron: %o', DEFAULT_ELECTRON_FLAGS)
    DEFAULT_ELECTRON_FLAGS.forEach(({ name, value }) => {
      value ? app.commandLine.appendSwitch(name, value) : app.commandLine.appendSwitch(name)
    })

    if (os.platform() === 'linux') {
      app.disableHardwareAcceleration()
    }

    if (process.env.ELECTRON_EXTRA_LAUNCH_ARGS) {
      // regex will be used to convert ELECTRON_EXTRA_LAUNCH_ARGS into an array, for example
      // input: 'foo --ipsum=0 --bar=--baz=quux --lorem="--ipsum=dolor --sit=amet"'
      // output: ['foo', '--ipsum=0', '--bar=--baz=quux', '--lorem="--ipsum=dolor --sit=amet"']
      const regex = /(?:[^\s"']+|"[^"]*"|'[^']*')+/g
      const electronLaunchArguments = process.env.ELECTRON_EXTRA_LAUNCH_ARGS.match(regex) || []

      electronLaunchArguments.forEach((arg) => {
        // arg can be just key --disable-http-cache
        // or key value --remote-debugging-port=8315
        // or key value with another value --foo=--bar=4196
        // or key value with another multiple value --foo='--bar=4196 --baz=quux'
        const [key, ...value] = arg.split('=')

        // because this is an environment variable, everything is a string
        // thus we don't have to worry about casting
        // --foo=false for example will be "--foo", "false"
        if (value.length) {
          let joinedValues = value.join('=')

          // check if the arg is wrapped in " or ' (unicode)
          const isWrappedInQuotes = !!['\u0022', '\u0027'].find(((charAsUnicode) => joinedValues.startsWith(charAsUnicode) && joinedValues.endsWith(charAsUnicode)))

          if (isWrappedInQuotes) {
            joinedValues = joinedValues.slice(1, -1)
          }

          app.commandLine.appendSwitch(key, joinedValues)
        } else {
          app.commandLine.appendSwitch(key)
        }
      })
    }
  } catch (e) {
    debug('environment error %s', e.message)
  }
}
