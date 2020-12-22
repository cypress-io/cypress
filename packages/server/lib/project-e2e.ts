import Bluebird from 'bluebird'
import check from 'check-more-types'
import Debug from 'debug'
import EE from 'events'
import la from 'lazy-ass'
import _ from 'lodash'
import path from 'path'
import R from 'ramda'
import commitInfo from '@cypress/commit-info'
import api from './api'
import Automation from './automation'
import browsers from './browsers'
import cache from './cache'
import config from './config'
import cwd from './cwd'
import errors from './errors'
import logger from './logger'
import plugins from './plugins'
import preprocessor from './plugins/preprocessor'
import ProjectBase from './project-base'
import Reporter from './reporter'
import savedState from './saved_state'
import scaffold from './scaffold'
import Server from './server'
import user from './user'
import { escapeFilenameInUrl } from './util/escape_filename'
import fs from './util/fs'
import keys from './util/keys'
import settings from './util/settings'
import specsUtil from './util/specs'
import Watchers from './watchers'

const debug = Debug('cypress:server:project')
const debugScaffold = Debug('cypress:server:scaffold')
const localCwd = cwd()
const multipleForwardSlashesRe = /[^:\/\/](\/{2,})/g

class ProjectE2E extends ProjectBase {
  get projectType () {
    return 'e2e'
  }

  open (options = {}) {
    debug('opening project instance %s', this.projectRoot)
    debug('project open options %o', options)
    this.server = new Server()

    _.defaults(options, {
      report: false,
      onFocusTests () {},
      onError () {},
      onWarning () {},
      onSettingsChanged: false,
    })

    debug('project options %o', options)
    this.options = options

    return this.getConfig(options)
    .tap((cfg) => {
      process.chdir(this.projectRoot)

      // attach warning message if user has "chromeWebSecurity: false" for unsupported browser
      if (cfg.chromeWebSecurity === false) {
        _.chain(cfg.browsers)
        .filter((browser) => browser.family !== 'chromium')
        .each((browser) => browser.warning = errors.getMsgByType('CHROME_WEB_SECURITY_NOT_SUPPORTED', browser.name))
        .value()
      }

      // TODO: we currently always scaffold the plugins file
      // even when headlessly or else it will cause an error when
      // we try to load it and it's not there. We must do this here
      // else initialing the plugins will instantly fail.
      if (cfg.pluginsFile) {
        debug('scaffolding with plugins file %s', cfg.pluginsFile)

        return scaffold.plugins(path.dirname(cfg.pluginsFile), cfg)
      }
    })
    .then((cfg) => {
      return this._initPlugins(cfg, options)
      .then((modifiedCfg) => {
        debug('plugin config yielded: %o', modifiedCfg)

        const updatedConfig = config.updateWithPluginValues(cfg, modifiedCfg)

        debug('updated config: %o', updatedConfig)

        return updatedConfig
      })
    })
    .then((cfg) => {
      return this.server.open(cfg, this, options.onError, options.onWarning)
      .spread((port, warning) => {
        // if we didnt have a cfg.port
        // then get the port once we
        // open the server
        if (!cfg.port) {
          cfg.port = port

          // and set all the urls again
          _.extend(cfg, config.setUrls(cfg))
        }

        // store the cfg from
        // opening the server
        this.cfg = cfg

        debug('project config: %o', _.omit(cfg, 'resolved'))

        if (warning) {
          options.onWarning(warning)
        }

        options.onSavedStateChanged = (state) => this.saveState(state)

        return Bluebird.join(
          this.watchSettingsAndStartWebsockets(options, cfg),
          this.scaffold(cfg),
        )
        .then(() => {
          return Bluebird.join(
            this.checkSupportFile(cfg),
            this.watchPluginsFile(cfg, options),
          )
        })
      })
    })
    .return(this)
  }

  _initPlugins (cfg, options) {
    // only init plugins with the
    // allowed config values to
    // prevent tampering with the
    // internals and breaking cypress
    cfg = config.allowed(cfg)

    return plugins.init(cfg, {
      projectRoot: this.projectRoot,
      configFile: settings.pathToConfigFile(this.projectRoot, options),
      onError (err) {
        debug('got plugins error', err.stack)

        browsers.close()

        options.onError(err)
      },
      onWarning: options.onWarning,
    })
  }

  close () {
    debug('closing project instance %s', this.projectRoot)

    this.cfg = null
    this.spec = null
    this.browser = null

    return Bluebird.join(
      this.server ? this.server.close() : undefined,
      this.watchers ? this.watchers.close() : undefined,
      preprocessor.close(),
    )
    .then(() => {
      return process.chdir(localCwd)
    })
  }
}

module.exports = ProjectE2E
