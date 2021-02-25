/* eslint-disable no-case-declarations */
const _ = require('lodash')
const ipc = require('electron').ipcMain
const { clipboard } = require('electron')
const debug = require('debug')('cypress:server:events')
const pluralize = require('pluralize')
const stripAnsi = require('strip-ansi')
const dialog = require('./dialog')
const pkg = require('./package')
const logs = require('./logs')
const auth = require('./auth')
const Windows = require('./windows')
const { openExternal } = require('./links')
const open = require('../util/open')
const user = require('../user')
const errors = require('../errors')
const Updater = require('../updater')
const { ProjectBase } = require('../project-base')
const openProject = require('../open_project')
const ensureUrl = require('../util/ensure-url')
const chromePolicyCheck = require('../util/chrome_policy_check')
const browsers = require('../browsers')
const konfig = require('../konfig')
const editors = require('../util/editors')
const fileOpener = require('../util/file-opener')
const api = require('../api')

const nullifyUnserializableValues = (obj) => {
  // nullify values that cannot be cloned
  // https://github.com/cypress-io/cypress/issues/6750
  return _.cloneDeepWith(obj, (val) => {
    if (_.isFunction(val)) {
      return null
    }
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
    case 'on:menu:clicked':
      return onBus('menu:item:clicked')

    case 'on:app:event':
      return onBus('app:events')

    case 'on:focus:tests':
      return onBus('focus:tests')

    case 'on:spec:changed':
      return onBus('spec:changed')

    case 'on:config:changed':
      return onBus('config:changed')

    case 'on:project:error':
      return onBus('project:error')

    case 'on:auth:message':
      return onBus('auth:message')

    case 'on:project:warning':
      return onBus('project:warning')

    case 'gui:error':
      return logs.error(arg)
      .then(sendNull)
      .catch(sendErr)

    case 'show:directory:dialog':
      return dialog.show()
      .then(send)
      .catch(sendErr)

    case 'log:in':
      return user.logIn(arg)
      .then(send)
      .catch(sendErr)

    case 'log:out':
      return user.logOut()
      .then(send)
      .catch(sendErr)

    case 'get:current:user':
      return user.getSafely()
      .then(send)
      .catch(sendErr)

    case 'external:open':
      return openExternal(arg)

    case 'close:browser':
      return openProject.closeBrowser()
      .then(send)
      .catch(sendErr)

    case 'launch:browser':
      // is there a way to lint the arguments received?
      debug('launching browser for \'%s\' spec: %o', arg.specType, arg.spec)
      debug('full list of options %o', arg)

      // the "arg" should have objects for
      //   - browser
      //   - spec (with fields)
      //       name, absolute, relative
      //   - specType: "integration" | "component"
      //   - specFilter (optional): the string user searched for
      const fullSpec = _.merge({}, arg.spec, {
        specType: arg.specType,
        specFilter: arg.specFilter,
      })

      return openProject.launch(arg.browser, fullSpec, {
        projectRoot: options.projectRoot,
        onBrowserOpen () {
          return send({ browserOpened: true })
        },
        onBrowserClose () {
          return send({ browserClosed: true })
        },
      })
      .catch((err) => {
        if (err.title == null) {
          err.title = 'Error launching browser'
        }

        return sendErr(err)
      })

    case 'begin:auth':
      const onMessage = (msg) => {
        return bus.emit('auth:message', msg)
      }

      return auth.start(onMessage, arg)
      .then(send)
      .catch(sendErr)

    case 'window:open':
      return options.windowOpenFn(options.projectRoot, arg)
      .then(send)
      .catch(sendErr)

    case 'window:close':
      return options.getWindowByWebContentsFn(event.sender).destroy()

    case 'open:file':
      return fileOpener.openFile(arg)

    case 'open:finder':
      return open.opn(arg)
      .then(send)
      .catch(sendErr)

    case 'get:options':
      return pkg(options)
      .then(send)
      .catch(sendErr)

    case 'updater:check':
      return Updater.check({
        onNewVersion ({ version }) {
          return send(version)
        },
        onNoNewVersion () {
          return send(false)
        },
      })

    case 'get:release:notes':
      return api.getReleaseNotes(arg)
      .then(send)
      .catch(sendNull)

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

    case 'get:orgs':
      return ProjectBase.getOrgs()
      .then(send)
      .catch(sendErr)

    case 'get:projects':
      return ProjectBase.getPathsAndIds()
      .then(send)
      .catch(sendErr)

    case 'get:project:statuses':
      return ProjectBase.getProjectStatuses(arg)
      .then(send)
      .catch(sendErr)

    case 'get:project:status':
      return ProjectBase.getProjectStatus(arg)
      .then(send)
      .catch(sendErr)

    case 'get:dashboard:projects':
      return ProjectBase.getDashboardProjects()
      .then(send)
      .catch(sendErr)

    case 'add:project':
      return ProjectBase.add(arg, options)
      .then(send)
      .catch(sendErr)

    case 'remove:project':
      return ProjectBase.remove(arg)
      .then(() => {
        return send(arg)
      })
      .catch(sendErr)

    case 'open:project':
      debug('open:project')

      const onSettingsChanged = () => {
        return bus.emit('config:changed')
      }

      const onSpecChanged = (spec) => {
        return bus.emit('spec:changed', spec)
      }

      const onFocusTests = function () {
        if (_.isFunction(options.onFocusTests)) {
          options.onFocusTests()
        }

        return bus.emit('focus:tests')
      }

      const onError = (err) => {
        return bus.emit('project:error', errors.clone(err, { html: true }))
      }

      const onWarning = function (warning) {
        warning.message = stripAnsi(warning.message)

        return bus.emit('project:warning', errors.clone(warning, { html: true }))
      }

      return browsers.getAllBrowsersWith(options.browser)
      .then((browsers = []) => {
        debug('setting found %s on the config', pluralize('browser', browsers.length, true))
        options.config = _.assign(options.config, { browsers })
      }).then(() => {
        chromePolicyCheck.run((err) => {
          return options.config.browsers.forEach((browser) => {
            if (browser.family === 'chromium') {
              browser.warning = errors.getMsgByType('BAD_POLICY_WARNING_TOOLTIP')
            }
          })
        })

        return openProject.create(arg, options, {
          onFocusTests,
          onSpecChanged,
          onSettingsChanged,
          onError,
          onWarning,
        })
      }).call('getConfig')
      .then(send)
      .catch(sendErr)

    case 'close:project':
      return openProject.close()
      .then(send)
      .catch(sendErr)

    case 'setup:dashboard:project':
      return openProject.createCiProject(arg)
      .then(send)
      .catch(sendErr)

    case 'set:project:id':
      return openProject.writeProjectId(arg)
      .then(send)
      .catch(sendErr)

    case 'get:record:keys':
      return openProject.getRecordKeys()
      .then(send)
      .catch(sendErr)

    case 'get:user:editor':
      return editors.getUserEditor(true)
      .then(send)
      .catch(sendErr)

    case 'set:user:editor':
      return editors.setUserEditor(arg)
      .then(send)
      .catch(sendErr)

    case 'get:specs':
      return openProject.getSpecChanges({
        onChange: send,
        onError: sendErr,
      })

    case 'get:runs':
      return openProject.getRuns()
      .then(send)
      .catch((err) => {
        err.type = _.get(err, 'statusCode') === 401 ?
          'UNAUTHENTICATED'
          : _.get(err, 'cause.code') === 'ESOCKETTIMEDOUT' ?
            'TIMED_OUT'
            : _.get(err, 'code') === 'ENOTFOUND' ?
              'NO_CONNECTION'
              :
              err.type || 'UNKNOWN'

        return sendErr(err)
      })

    case 'request:access':
      return openProject.requestAccess(arg)
      .then(send)
      .catch((err) => {
        err.type = _.get(err, 'statusCode') === 403 ?
          'ALREADY_MEMBER'
          : (_.get(err, 'statusCode') === 422) && /existing/.test(err.errors && err.errors.userId, (x) => {
            return x.join('')
          }) ?
            'ALREADY_REQUESTED'
            :
            err.type || 'UNKNOWN'

        return sendErr(err)
      })

    case 'onboarding:closed':
      return openProject.getProject()
      .saveState({ showedOnBoardingModal: true })
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

module.exports = {
  nullifyUnserializableValues,

  handleEvent,

  stop () {
    return ipc.removeAllListeners()
  },

  start (options, bus) {
    // curry left options
    return ipc.on('request', _.partial(this.handleEvent, options, bus))
  },

}
