const getHandlersByType = (type) => {
  switch (type) {
    case 'return-array-mutation':
      return {
        onBeforeBrowserLaunch (browser, options) {
          // this will emit a warning but only once
          options = options.concat(['--foo'])
          options.push('--foo=bar')
          options.unshift('--load-extension=/foo/bar/baz.js')

          return options
        },
      }

    case 'return-new-array-without-mutation':
      return {
        onBeforeBrowserLaunch (browser, options) {
          // this will emit a warning
          options = [...options, '--foo']

          return options
        },
      }

    case 'return-options-mutate-only-args-property':
      return {
        onBeforeBrowserLaunch (browser, options) {
          // this will NOT emit a warning
          options.args.push('--foo')
          options.args.unshift('--bar')

          return options
        },
      }

    case 'return-undefined-mutate-array':
      return {
        onBeforeBrowserLaunch (browser, options) {
          // this will emit a warning
          options.push('--foo')
          options.push('--bar')

          return
        },
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
