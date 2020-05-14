const _ = require('lodash')
const cp = require('bluebird').promisifyAll(require('child_process'))
const { expect } = require('chai')

const assertPsOutput = (strs) => {
  if (!_.isArray(strs)) {
    strs = [strs]
  }

  return () => {
    return cp.execAsync('ps -fww')
    .call('toString')
    .then((psOutput) => {
      _.forEach(strs, (str) => {
        expect(psOutput, 'ps output').contain(str)
      })

      return null
    })
  }
}

const getHandlersByType = (type) => {
  switch (type) {
    case 'return-array-mutation':
      return {
        onBeforeBrowserLaunch (browser, launchOptions) {
          // this will emit a warning but only once
          launchOptions = launchOptions.concat(['--foo'])
          launchOptions.push('--foo=bar')
          launchOptions.unshift('--load-extension=/foo/bar/baz.js')

          return launchOptions
        },
        onTask: { assertPsOutput: assertPsOutput(['--foo', '--foo=bar']) },
      }

    case 'return-new-array-without-mutation':
      return {
        onBeforeBrowserLaunch (browser, launchOptions) {
          // this will emit a warning
          launchOptions = [...launchOptions, '--foo']

          return launchOptions
        },
        onTask: { assertPsOutput: assertPsOutput('--foo') },
      }

    case 'return-launch-options-mutate-only-args-property':
      return {
        onBeforeBrowserLaunch (browser, launchOptions) {
          // this will NOT emit a warning
          launchOptions.args.push('--foo')
          launchOptions.args.unshift('--bar')

          return launchOptions
        },
        onTask: { assertPsOutput: assertPsOutput(['--foo', '--bar']) },
      }

    case 'return-undefined-mutate-array':
      return {
        onBeforeBrowserLaunch (browser, launchOptions) {
          // this will emit a warning
          launchOptions.push('--foo')
          launchOptions.push('--bar')

          return
        },
        onTask: { assertPsOutput: assertPsOutput([]) },
      }

    case 'return-unknown-properties':
      return {
        onBeforeBrowserLaunch (browser, launchOptions) {
          // this will fail with an error
          launchOptions.foo = 'foo'
          launchOptions.width = 800
          launchOptions.height = 600

          return launchOptions
        },
        onTask: {},
      }

    case 'throw-explicit-error':
      return {
        onBeforeBrowserLaunch (browser, launchOptions) {
          throw new Error('Error thrown from plugins handler')
        },
        onTask: {},
      }

    case 'reject-promise':
      return {
        onBeforeBrowserLaunch (browser, launchOptions) {
          return Promise
          .resolve(null)
          .then(() => {
            throw new Error('Promise rejected from plugins handler')
          })
        },
        onTask: {},
      }

    default: () => {
      throw new Error('config.env.BEFORE_BROWSER_LAUNCH_HANDLER must be set to a valid handler type')
    }
  }
}

module.exports = (on, config) => {
  const beforeBrowserLaunchHandler = config.env.BEFORE_BROWSER_LAUNCH_HANDLER

  if (!beforeBrowserLaunchHandler) {
    throw new Error('config.env.BEFORE_BROWSER_LAUNCH_HANDLER must be set to a valid handler type')
  }

  const { onBeforeBrowserLaunch, onTask } = getHandlersByType(beforeBrowserLaunchHandler)

  on('before:browser:launch', onBeforeBrowserLaunch)
  on('task', onTask)
}
