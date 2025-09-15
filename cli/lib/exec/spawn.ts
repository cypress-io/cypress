import _ from 'lodash'
import os from 'os'
import cp from 'child_process'
import path from 'path'
import Bluebird from 'bluebird'
import Debug from 'debug'
import util from '../util'
import state from '../tasks/state'
import xvfb from './xvfb'
import { needsSandbox } from '../tasks/verify'
import { throwFormErrorText, getError, errors } from '../errors'
import readline from 'readline'
import { stdin, stdout, stderr } from 'process'

const debug = Debug('cypress:cli')

function isPlatform (platform: string): boolean {
  return os.platform() === platform
}

function needsStderrPiped (needsXvfb: boolean): boolean {
  return _.some([
    isPlatform('darwin'),

    (needsXvfb && isPlatform('linux')),

    util.isPossibleLinuxWithIncorrectDisplay(),
  ])
}

function needsEverythingPipedDirectly (): boolean {
  return isPlatform('win32')
}

function getStdio (needsXvfb: boolean): any {
  if (needsEverythingPipedDirectly()) {
    return 'pipe'
  }

  // https://github.com/cypress-io/cypress/issues/921
  // https://github.com/cypress-io/cypress/issues/1143
  // https://github.com/cypress-io/cypress/issues/1745
  if (needsStderrPiped(needsXvfb)) {
    // returning pipe here so we can massage stderr
    // and remove garbage from Xlib and libuv
    // due to starting the Xvfb process on linux
    return ['inherit', 'inherit', 'pipe']
  }

  return 'inherit'
}

const spawnModule = {
  async start (args: any, options: any = {}): Promise<any> {
    const needsXvfb = xvfb.isNeeded()
    let executable = state.getPathToExecutable(state.getBinaryDir())

    if (util.getEnv('CYPRESS_RUN_BINARY')) {
      executable = path.resolve(util.getEnv('CYPRESS_RUN_BINARY') as string)
    }

    debug('needs to start own Xvfb?', needsXvfb)

    // Always push cwd into the args
    // which additionally acts as a signal to the
    // binary that it was invoked through the NPM module
    args = args || []
    if (typeof args === 'string') {
      args = [args]
    }

    args = [...args, '--cwd', process.cwd(), '--userNodePath', process.execPath, '--userNodeVersion', process.versions.node]

    _.defaults(options, {
      dev: false,
      env: process.env,
      detached: false,
      stdio: getStdio(needsXvfb),
    })

    const spawn = (overrides: any = {}): any => {
      return new Bluebird((resolve: any, reject: any) => {
        _.defaults(overrides, {
          onStderrData: false,
        })

        const { onStderrData } = overrides
        const envOverrides = util.getEnvOverrides(options)
        const electronArgs: string[] = []
        const node11WindowsFix = isPlatform('win32')

        let startScriptPath: string | undefined

        if (options.dev) {
          executable = 'node'
          // if we're in dev then reset
          // the launch cmd to be 'npm run dev'
          startScriptPath = path.resolve(__dirname, '..', '..', '..', 'scripts', 'start.js')

          debug('in dev mode the args became %o', args)
        }

        if (!options.dev && needsSandbox()) {
          electronArgs.push('--no-sandbox')
        }

        // strip dev out of child process options
        /**
         * @type {import('child_process').ForkOptions}
         */
        let stdioOptions: any = _.pick(options, 'env', 'detached', 'stdio')

        // figure out if we're going to be force enabling or disabling colors.
        // also figure out whether we should force stdout and stderr into thinking
        // it is a tty as opposed to a pipe.
        stdioOptions.env = _.extend({}, stdioOptions.env, envOverrides)

        if (node11WindowsFix) {
          stdioOptions = _.extend({}, stdioOptions, { windowsHide: false })
        }

        if (util.isPossibleLinuxWithIncorrectDisplay()) {
          // make sure we use the latest DISPLAY variable if any
          debug('passing DISPLAY', process.env.DISPLAY)
          stdioOptions.env.DISPLAY = process.env.DISPLAY
        }

        if (stdioOptions.env.ELECTRON_RUN_AS_NODE) {
          // Since we are running electron as node, we need to add an entry point file.
          startScriptPath = path.join(state.getBinaryPkgPath(path.dirname(executable)), '..', 'index.js')
        } else {
          // Start arguments with "--" so Electron knows these are OUR
          // arguments and does not try to sanitize them. Otherwise on Windows
          // an url in one of the arguments crashes it :(
          // https://github.com/cypress-io/cypress/issues/5466
          args = [...electronArgs, '--', ...args]
        }

        if (startScriptPath) {
          args.unshift(startScriptPath)
        }

        if (process.env.CYPRESS_INTERNAL_DEV_DEBUG) {
          args.unshift(process.env.CYPRESS_INTERNAL_DEV_DEBUG)
        }

        debug('spawn args %o %o', args, _.omit(stdioOptions, 'env'))
        debug('spawning Cypress with executable: %s', executable)

        const child = cp.spawn(executable, args, stdioOptions)

        function resolveOn (event: any): any {
          return async function (code: any, signal: any): Promise<any> {
            debug('child event fired %o', { event, code, signal })

            if (code === null) {
              const errorObject = errors.childProcessKilled(event, signal)

              const err = await getError(errorObject)

              return reject(err)
            }

            resolve(code)
          }
        }

        child.on('close', resolveOn('close'))
        child.on('exit', resolveOn('exit'))
        child.on('error', reject)

        if (isPlatform('win32')) {
          const rl = readline.createInterface({
            input: stdin,
            output: stdout,
          })

          // on windows, SIGINT does not propagate to the child process when ctrl+c is pressed
          // this makes sure all nested processes are closed(ex: firefox inside the server)
          rl.on('SIGINT', async function () {
            const kill = (await import('tree-kill')).default

            kill(child.pid as number, 'SIGINT')
          })
        }

        // if stdio options is set to 'pipe', then
        //   we should set up pipes:
        //  process STDIN (read stream) => child STDIN (writeable)
        //  child STDOUT => process STDOUT
        //  child STDERR => process STDERR with additional filtering
        if (child.stdin) {
          debug('piping process STDIN into child STDIN')
          stdin.pipe(child.stdin)
        }

        if (child.stdout) {
          debug('piping child STDOUT to process STDOUT')
          child.stdout.pipe(stdout)
        }

        // if this is defined then we are manually piping for linux
        // to filter out the garbage
        if (child.stderr) {
          debug('piping child STDERR to process STDERR')
          child.stderr.on('data', (data: any) => {
            const str = data.toString()

            // if we have a callback and this explicitly returns
            // false then bail
            if (onStderrData && onStderrData(str)) {
              return
            }

            // else pass it along!
            stderr.write(data)
          })
        }

        // https://github.com/cypress-io/cypress/issues/1841
        // https://github.com/cypress-io/cypress/issues/5241
        // In some versions of node, it will throw on windows
        // when you close the parent process after piping
        // into the child process. unpiping does not seem
        // to have any effect. so we're just catching the
        // error here and not doing anything.
        stdin.on('error', (err: any) => {
          if (['EPIPE', 'ENOTCONN'].includes(err.code)) {
            return
          }

          throw err
        })

        if (stdioOptions.detached) {
          child.unref()
        }
      })
    }

    const spawnInXvfb = async (): Promise<number> => {
      try {
        await xvfb.start()

        const code = await userFriendlySpawn()

        return code
      } finally {
        await xvfb.stop()
      }
    }

    const userFriendlySpawn = async (linuxWithDisplayEnv?: any): Promise<any> => {
      debug('spawning, should retry on display problem?', Boolean(linuxWithDisplayEnv))

      let brokenGtkDisplay: boolean = false

      const overrides: any = {}

      if (linuxWithDisplayEnv) {
        _.extend(overrides, {
          electronLogging: true,
          onStderrData (str: string): any {
            // if we receive a broken pipe anywhere
            // then we know that's why cypress exited early
            if (util.isBrokenGtkDisplay(str)) {
              brokenGtkDisplay = true
            }
          },
        })
      }

      try {
        const code: number = await spawn(overrides)

        if (code !== 0 && brokenGtkDisplay) {
          util.logBrokenGtkDisplayWarning()

          return spawnInXvfb()
        }

        return code
      } catch (error: any) {
        // we can format and handle an error message from the code above
        // prevent wrapping error again by using "known: undefined" filter
        if ((error as any).known === undefined) {
          const raiseErrorFn = throwFormErrorText(errors.unexpected)

          await raiseErrorFn(error.message)
        }

        throw error
      }
    }

    if (needsXvfb) {
      return spawnInXvfb()
    }

    // if we are on linux and there's already a DISPLAY
    // set, then we may need to rerun cypress after
    // spawning our own Xvfb server
    const linuxWithDisplayEnv = util.isPossibleLinuxWithIncorrectDisplay()

    return userFriendlySpawn(linuxWithDisplayEnv)
  },
}

export default spawnModule
