const _ = require('lodash')
const os = require('os')
const cp = require('child_process')
const path = require('path')
const Promise = require('bluebird')
const debug = require('debug')('cypress:cli')
const debugVerbose = require('debug')('cypress-verbose:cli')

const util = require('../util')
const state = require('../tasks/state')
const xvfb = require('./xvfb')
const verify = require('../tasks/verify')
const errors = require('../errors')
const readline = require('readline')

const isXlibOrLibudevRe = /^(?:Xlib|libudev)/
const isHighSierraWarningRe = /\*\*\* WARNING/
const isRenderWorkerRe = /\.RenderWorker-/

// Chromium (which Electron uses) always makes several attempts to connect to the system dbus.
// This works fine in most desktop environments, but in a docker container, there is no dbus service
// and Chromium emits several error lines, similar to these:

// [1957:0406/160550.146820:ERROR:bus.cc(392)] Failed to connect to the bus: Failed to connect to socket /var/run/dbus/system_bus_socket: No such file or directory
// [1957:0406/160550.147994:ERROR:bus.cc(392)] Failed to connect to the bus: Address does not contain a colon

// These warnings are absolutely harmless. Failure to connect to dbus means that electron won't be able to access the user's
// credential wallet (none exists in a docker container) and won't show up in the system tray (again, none exists).
// Failure to connect is expected and normal here, but users frequently misidentify these errors as the cause of their problems.

// https://github.com/cypress-io/cypress/issues/19299
const isDbusWarning = /Failed to connect to the bus:/

// Electron began logging these on self-signed certs with 17.0.0-alpha.4.
// Once this is fixed upstream this regex can be removed: https://github.com/electron/electron/issues/34583
// Sample:
// [3801:0606/152837.383892:ERROR:cert_verify_proc_builtin.cc(681)] CertVerifyProcBuiltin for www.googletagmanager.com failed:
// ----- Certificate i=0 (OU=Cypress Proxy Server Certificate,O=Cypress Proxy CA,L=Internet,ST=Internet,C=Internet,CN=www.googletagmanager.com) -----
// ERROR: No matching issuer found
const isCertVerifyProcBuiltin = /(^\[.*ERROR:cert_verify_proc_builtin\.cc|^----- Certificate i=0 \(OU=Cypress Proxy|^ERROR: No matching issuer found$)/

/**
 * Electron logs benign warnings about Vulkan when run on hosts that do not have a GPU. This is coming from the primary Electron process,
 * and not the browser being used for tests.
 * Samples:
 * Warning: loader_scanned_icd_add: Driver /usr/lib/x86_64-linux-gnu/libvulkan_intel.so supports Vulkan 1.2, but only supports loader interface version 4. Interface version 5 or newer required to support this version of Vulkan (Policy #LDP_DRIVER_7)
 * Warning: loader_scanned_icd_add: Driver /usr/lib/x86_64-linux-gnu/libvulkan_lvp.so supports Vulkan 1.1, but only supports loader interface version 4. Interface version 5 or newer required to support this version of Vulkan (Policy #LDP_DRIVER_7)
 * Warning: loader_scanned_icd_add: Driver /usr/lib/x86_64-linux-gnu/libvulkan_radeon.so supports Vulkan 1.2, but only supports loader interface version 4. Interface version 5 or newer required to support this verison of Vulkan (Policy #LDP_DRIVER_7)
 * Warning: Layer VK_LAYER_MESA_device_select uses API version 1.2 which is older than the application specified API version of 1.3. May cause issues.
 */

const isHostVulkanDriverWarning = /^Warning:.+(#LDP_DRIVER_7|VK_LAYER_MESA_device_select).+/

/**
 * Electron logs benign warnings about Vulkan when run in docker containers whose host does not have a GPU. This is coming from the primary
 * Electron process, and not the browser being used for tests.
 * Sample:
 * Warning: vkCreateInstance: Found no drivers!
 * Warning: vkCreateInstance failed with VK_ERROR_INCOMPATIBLE_DRIVER
 *     at CheckVkSuccessImpl (../../third_party/dawn/src/dawn/native/vulkan/VulkanError.cpp:88)
 *     at CreateVkInstance (../../third_party/dawn/src/dawn/native/vulkan/BackendVk.cpp:458)
 *     at Initialize (../../third_party/dawn/src/dawn/native/vulkan/BackendVk.cpp:344)
 *     at Create (../../third_party/dawn/src/dawn/native/vulkan/BackendVk.cpp:266)
 *     at operator() (../../third_party/dawn/src/dawn/native/vulkan/BackendVk.cpp:521)
 */

const isContainerVulkanDriverWarning = /^Warning: vkCreateInstance/

const isContainerVulkanStack = /^\s*at (CheckVkSuccessImpl|CreateVkInstance|Initialize|Create|operator).+(VulkanError|BackendVk).cpp/

/**
 * In Electron 32.0.0 a new debug scenario log message started appearing when iframes navigate to about:blank. This is a benign message.
 * https://github.com/electron/electron/issues/44368
 * Sample:
 * [78887:1023/114920.074882:ERROR:debug_utils.cc(14)] Hit debug scenario: 4
 */
const isDebugScenario4 = /^\[[^\]]+debug_utils\.cc[^\]]+\] Hit debug scenario: 4/

/**
 * In Electron 32.0.0 a new EGL driver message started appearing when running on Linux. This is a benign message.
 * https://github.com/electron/electron/issues/43415
 * Sample:
 * [78887:1023/114920.074882:ERROR:gl_display.cc(14)] EGL Driver message (Error) eglQueryDeviceAttribEXT: Bad attribute.
 */
const isEGLDriverMessage = /^\[[^\]]+gl_display\.cc[^\]]+\] EGL Driver message \(Error\) eglQueryDeviceAttribEXT: Bad attribute\./

/**
 * Mesa/GLX related warnings that occur in certain Linux environments without proper GPU support
 * or when running in containers. These are benign warnings that don't affect functionality.
 * Samples:
 * error: XDG_RUNTIME_DIR is invalid or not set in the environment.
 * MESA: error: ZINK: failed to choose pdev
 * glx: failed to create drisw screen
 */
const isXdgRuntimeError = /^error: XDG_RUNTIME_DIR is invalid or not set/
const isMesaZinkError = /^MESA: error: ZINK: failed to choose pdev/
const isGlxDriverError = /^glx: failed to create drisw screen/

const GARBAGE_WARNINGS = [
  isXlibOrLibudevRe,
  isHighSierraWarningRe,
  isRenderWorkerRe,
  isDbusWarning,
  isCertVerifyProcBuiltin,
  isHostVulkanDriverWarning,
  isContainerVulkanDriverWarning,
  isContainerVulkanStack,
  isDebugScenario4,
  isEGLDriverMessage,
  isXdgRuntimeError,
  isMesaZinkError,
  isGlxDriverError,
]

const isGarbageLineWarning = (str) => {
  return _.some(GARBAGE_WARNINGS, (re) => {
    return re.test(str)
  })
}

function isPlatform (platform) {
  return os.platform() === platform
}

function needsStderrPiped (needsXvfb) {
  return _.some([
    isPlatform('darwin'),

    (needsXvfb && isPlatform('linux')),

    util.isPossibleLinuxWithIncorrectDisplay(),
  ])
}

function needsEverythingPipedDirectly () {
  return isPlatform('win32')
}

function getStdio (needsXvfb) {
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

module.exports = {
  isGarbageLineWarning,

  start (args, options = {}) {
    const needsXvfb = xvfb.isNeeded()
    let executable = state.getPathToExecutable(state.getBinaryDir())

    if (util.getEnv('CYPRESS_RUN_BINARY')) {
      executable = path.resolve(util.getEnv('CYPRESS_RUN_BINARY'))
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

    const spawn = (overrides = {}) => {
      return new Promise((resolve, reject) => {
        _.defaults(overrides, {
          onStderrData: false,
        })

        const { onStderrData } = overrides
        const envOverrides = util.getEnvOverrides(options)
        const electronArgs = []
        const node11WindowsFix = isPlatform('win32')

        let startScriptPath

        if (options.dev) {
          executable = 'node'
          // if we're in dev then reset
          // the launch cmd to be 'npm run dev'
          startScriptPath = path.resolve(__dirname, '..', '..', '..', 'scripts', 'start.js'),

          debug('in dev mode the args became %o', args)
        }

        if (!options.dev && verify.needsSandbox()) {
          electronArgs.push('--no-sandbox')
        }

        // strip dev out of child process options
        /**
         * @type {import('child_process').ForkOptions}
         */
        let stdioOptions = _.pick(options, 'env', 'detached', 'stdio')

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

        function resolveOn (event) {
          return function (code, signal) {
            debug('child event fired %o', { event, code, signal })

            if (code === null) {
              const errorObject = errors.errors.childProcessKilled(event, signal)

              return errors.getError(errorObject).then(reject)
            }

            resolve(code)
          }
        }

        child.on('close', resolveOn('close'))
        child.on('exit', resolveOn('exit'))
        child.on('error', reject)

        if (isPlatform('win32')) {
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
          })

          // on windows, SIGINT does not propagate to the child process when ctrl+c is pressed
          // this makes sure all nested processes are closed(ex: firefox inside the server)
          rl.on('SIGINT', function () {
            let kill = require('tree-kill')

            kill(child.pid, 'SIGINT')
          })
        }

        // if stdio options is set to 'pipe', then
        //   we should set up pipes:
        //  process STDIN (read stream) => child STDIN (writeable)
        //  child STDOUT => process STDOUT
        //  child STDERR => process STDERR with additional filtering
        if (child.stdin) {
          debug('piping process STDIN into child STDIN')
          process.stdin.pipe(child.stdin)
        }

        if (child.stdout) {
          debug('piping child STDOUT to process STDOUT')
          child.stdout.pipe(process.stdout)
        }

        // if this is defined then we are manually piping for linux
        // to filter out the garbage
        if (child.stderr) {
          debug('piping child STDERR to process STDERR')
          child.stderr.on('data', (data) => {
            const str = data.toString()

            // bail if this is warning line garbage
            if (isGarbageLineWarning(str)) {
              debugVerbose(str)

              return
            }

            // if we have a callback and this explicitly returns
            // false then bail
            if (onStderrData && onStderrData(str)) {
              return
            }

            // else pass it along!
            process.stderr.write(data)
          })
        }

        // https://github.com/cypress-io/cypress/issues/1841
        // https://github.com/cypress-io/cypress/issues/5241
        // In some versions of node, it will throw on windows
        // when you close the parent process after piping
        // into the child process. unpiping does not seem
        // to have any effect. so we're just catching the
        // error here and not doing anything.
        process.stdin.on('error', (err) => {
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

    const spawnInXvfb = () => {
      return xvfb
      .start()
      .then(userFriendlySpawn)
      .finally(xvfb.stop)
    }

    const userFriendlySpawn = (linuxWithDisplayEnv) => {
      debug('spawning, should retry on display problem?', Boolean(linuxWithDisplayEnv))

      let brokenGtkDisplay

      const overrides = {}

      if (linuxWithDisplayEnv) {
        _.extend(overrides, {
          electronLogging: true,
          onStderrData (str) {
            // if we receive a broken pipe anywhere
            // then we know that's why cypress exited early
            if (util.isBrokenGtkDisplay(str)) {
              brokenGtkDisplay = true
            }
          },
        })
      }

      return spawn(overrides)
      .then((code) => {
        if (code !== 0 && brokenGtkDisplay) {
          util.logBrokenGtkDisplayWarning()

          return spawnInXvfb()
        }

        return code
      })
      // we can format and handle an error message from the code above
      // prevent wrapping error again by using "known: undefined" filter
      .catch({ known: undefined }, errors.throwFormErrorText(errors.errors.unexpected))
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
