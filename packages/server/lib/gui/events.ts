/* eslint-disable no-case-declarations */
const _ = require('lodash')
const ipc = require('electron').ipcMain
const debug = require('debug')('cypress:server:events')

import type { LaunchArgs } from '@packages/types'
import type { EventEmitter } from 'events'

const nullifyUnserializableValues = (obj) => {
  // nullify values that cannot be cloned
  // https://github.com/cypress-io/cypress/issues/6750
  return _.cloneDeepWith(obj, (val) => {
    if (_.isFunction(val)) {
      return null
    }

    return undefined
  })
}

const handleEvent = function (options, bus, event, id, type, arg) {
  debug('got request for event: %s, %o', type, arg)

  switch (type) {
    case 'launch:browser':
      // TIM: Commented out for reference w/ the new implementation
      // // is there a way to lint the arguments received?
      // debug('launching browser for \'%s\' spec: %o', arg.specType, arg.spec)
      // debug('full list of options %o', arg)

      // // the "arg" should have objects for
      // //   - browser
      // //   - spec (with fields)
      // //       name, absolute, relative
      // //   - specType: "integration" | "component"
      // //   - specFilter (optional): the string user searched for
      // const fullSpec = _.merge({}, arg.spec, {
      //   specType: arg.specType,
      //   specFilter: arg.specFilter,
      // })

      // return openProject.launch(arg.browser, fullSpec, {
      //   // TODO: Tim see why this "projectRoot" is passed along
      //   projectRoot: options.projectRoot,
      //   onBrowserOpen () {
      //     return send({ browserOpened: true })
      //   },
      //   onBrowserClose () {
      //     return send({ browserClosed: true })
      //   },
      // })
      // .catch((err) => {
      //   if (err.title == null) {
      //     err.title = 'Error launching browser'
      //   }

      //   return sendErr(err)
      // })
      return

    case 'open:project':
      // debug('open:project')

      // const onSettingsChanged = () => {
      //   return bus.emit('config:changed')
      // }

      // const onSpecChanged = (spec) => {
      //   return bus.emit('spec:changed', spec)
      // }

      // const onFocusTests = function () {
      //   if (_.isFunction(options.onFocusTests)) {
      //     options.onFocusTests()
      //   }

      //   return bus.emit('focus:tests')
      // }

      // const onError = (err) => {
      //   return bus.emit('project:error', errors.clone(err, { html: true }))
      // }

      // const onWarning = function (warning) {
      //   warning.message = stripAnsi(warning.message)

      //   return bus.emit('project:warning', errors.clone(warning, { html: true }))
      // }

      // return browsers.getAllBrowsersWith(options.browser)
      // .then((browsers = []) => {
      //   debug('setting found %s on the config', pluralize('browser', browsers.length, true))
      //   options.config = _.assign(options.config, { browsers })
      // }).then(() => {
      //   chromePolicyCheck.run((err) => {
      //     return options.config.browsers.forEach((browser) => {
      //       if (browser.family === 'chromium') {
      //         browser.warning = errors.getMsgByType('BAD_POLICY_WARNING_TOOLTIP')
      //       }
      //     })
      //   })

      //   return openProject.create(arg, options, {
      //     onFocusTests,
      //     onSpecChanged,
      //     onSettingsChanged,
      //     onError,
      //     onWarning,
      //   })
      // }).call('getConfig')
      // .then((config) => {
      //   if (config.configFile && path.isAbsolute(config.configFile)) {
      //     config.configFile = path.relative(arg, config.configFile)
      //   }

      //   // those two values make no sense to display in
      //   // the GUI
      //   if (config.resolved) {
      //     config.resolved.configFile = undefined
      //     config.resolved.testingType = undefined
      //   }

      //   return config
      // })
      // .then(send)
      // .catch(sendErr)
      return

    case 'has:opened:cypress':
      // return savedState.create()
      // .then(async (state) => {
      //   const currentState = await state.get()

      //   // we check if there is any state at all so users existing before
      //   // we added firstOpenedCypress are not marked as new
      //   const hasOpenedCypress = !!Object.keys(currentState).length

      //   if (!currentState.firstOpenedCypress) {
      //     await state.set('firstOpenedCypress', Date.now())
      //   }

      //   return hasOpenedCypress
      // })
      // .then(send)
      return

    case 'ping:baseUrl':
      // NOTE: Keeping this code around to ensure we keep this for v10
      // const baseUrl = arg

      // return ensureUrl.isListening(baseUrl)
      // .then(send)
      // .catch((err) => {
      //   const warning = errors.get('CANNOT_CONNECT_BASE_URL_WARNING', baseUrl)

      //   return sendErr(warning)
      // })
      return

      // TODO: setClipboardText mutation
      // case 'set:clipboard:text':
      //   clipboard.writeText(arg)

      //   return sendNull()

    default:
      throw new Error(`No ipc event registered for: '${type}'`)
  }
}

interface EventsStartArgs extends LaunchArgs {
  onFocusTests: () => void
}

export = {
  nullifyUnserializableValues,

  handleEvent,

  stop () {
    return ipc.removeAllListeners()
  },

  async start (options: EventsStartArgs, bus: EventEmitter) {
    // curry left options
    // ipc.on('request', _.partial(this.handleEvent, options, bus))
  },
}
