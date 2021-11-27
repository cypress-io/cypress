/* eslint-disable no-case-declarations */
const _ = require('lodash')
const ipc = require('electron').ipcMain
const { clipboard } = require('electron')
const debug = require('debug')('cypress:server:events')

const dialog = require('./dialog')
const logs = require('./logs')
const Windows = require('./windows')
const files = require('./files')
const errors = require('../errors')
const Updater = require('../updater')
const ProjectStatic = require('../project_static')

const ensureUrl = require('../util/ensure-url')
const konfig = require('../konfig')
const savedState = require('../saved_state')

import { openProject } from '../open_project'
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

  _.defaults(options, {
    windowOpenFn: Windows.open,
    getWindowByWebContentsFn: Windows.getByWebContents,
  })

  const sendResponse = function (originalData = {}) {
    try {
      const data = nullifyUnserializableValues(originalData)

      debug('sending ipc data %o', { type, data, originalData })

      return event.sender.send('response', data)
    } catch (error) {} // eslint-disable-line no-empty
  }

  const sendErr = function (err) {
    debug('send error: %o', err)

    return sendResponse({ id, __error: errors.clone(err, { html: true }) })
  }

  const send = (data) => {
    return sendResponse({ id, data })
  }

  const sendNull = () => {
    return send(null)
  }

  const onBus = function (event) {
    bus.removeAllListeners(event)

    return bus.on(event, send)
  }

  switch (type) {
    case 'on:app:event':
      return onBus('app:events')

    case 'on:spec:changed':
      return onBus('spec:changed')

    case 'on:project:error':
      return onBus('project:error')

    case 'on:project:warning':
      return onBus('project:warning')

    case 'show:directory:dialog':
      return dialog.show()
      .then(send)
      .catch(sendErr)

    case 'show:new:spec:dialog':
      return files.showDialogAndCreateSpec()
      .then(send)
      .catch(sendErr)

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

    case 'window:open':
      return options.windowOpenFn(options.projectRoot, arg)
      .then(send)
      .catch(sendErr)

    case 'window:close':
      return options.getWindowByWebContentsFn(event.sender).destroy()

    case 'updater:check':
      return Updater.check({
        ...arg,
        onNewVersion ({ version }) {
          return send(version)
        },
        onNoNewVersion () {
          return send(false)
        },
      })

    case 'get:logs':
      return logs.get()
      .then(send)
      .catch(sendErr)

    case 'clear:logs':
      return logs.clear()
      .then(sendNull)
      .catch(sendErr)

    case 'on:log':
      return logs.onLog(send)

    case 'off:log':
      logs.off()

      return send(null)

    case 'remove:project':
      return ProjectStatic.remove(arg)
      .then(() => {
        return send(arg)
      })
      .catch(sendErr)

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

    case 'setup:dashboard:project':
      return ProjectStatic.createCiProject(arg, arg.projectRoot)
      .then(send)
      .catch(sendErr)

    case 'set:project:id':
      return ProjectStatic.writeProjectId(arg)
      .then(send)
      .catch(sendErr)

    case 'request:access':
      return openProject.requestAccess(arg)
      .then(send)
      .catch((err) => {
        err.type = _.get(err, 'statusCode') === 403 ?
          'ALREADY_MEMBER'
          : (_.get(err, 'statusCode') === 422) && /existing/.test(err.errors?.userId?.join('')) ?
            'ALREADY_REQUESTED'
            :
            err.type || 'UNKNOWN'

        return sendErr(err)
      })

    case 'new:project:banner:closed':
      return openProject.getProject()
      ?.saveState({ showedNewProjectBanner: true })
      .then(sendNull)

    case 'has:opened:cypress':
      return savedState.create()
      .then(async (state) => {
        const currentState = await state.get()

        // we check if there is any state at all so users existing before
        // we added firstOpenedCypress are not marked as new
        const hasOpenedCypress = !!Object.keys(currentState).length

        if (!currentState.firstOpenedCypress) {
          await state.set('firstOpenedCypress', Date.now())
        }

        return hasOpenedCypress
      })
      .then(send)

    case 'remove:scaffolded:files':
      return openProject.getProject()
      ?.removeScaffoldedFiles()
      .then(sendNull)

    case 'set:prompt:shown':
      return openProject.getProject()
      ?.saveState({
        promptsShown: {
          ...(openProject.getProject()?.state?.promptsShown ?? {}),
          [arg]: Date.now(),
        },
      })
      .then(sendNull)

    case 'ping:api:server':
      const apiUrl = konfig('api_url')

      return ensureUrl.isListening(apiUrl)
      .then(send)
      .catch((err) => {
        // if it's an aggegrate error, just send the first one
        if (err.length) {
          const subErr = err[0]

          err.name = subErr.name || `${subErr.code} ${subErr.address}:${subErr.port}`
          err.message = subErr.message || `${subErr.code} ${subErr.address}:${subErr.port}`
        }

        err.apiUrl = apiUrl

        return sendErr(err)
      })

    case 'ping:baseUrl':
      const baseUrl = arg

      return ensureUrl.isListening(baseUrl)
      .then(send)
      .catch((err) => {
        const warning = errors.get('CANNOT_CONNECT_BASE_URL_WARNING', baseUrl)

        return sendErr(warning)
      })

    case 'set:clipboard:text':
      clipboard.writeText(arg)

      return sendNull()

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
    ipc.on('request', _.partial(this.handleEvent, options, bus))
  },
}
