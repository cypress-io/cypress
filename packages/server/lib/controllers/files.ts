import _ from 'lodash'
import path from 'path'
import cwd from '../cwd'
import Debug from 'debug'
import { escapeFilenameInUrl } from '../util/escape_filename'
import { getCtx } from '@packages/data-context'
import { DocumentDomainInjection } from '@packages/network/lib/document-domain-injection'
import { privilegedCommandsManager } from '../privileged-commands/privileged-commands-manager'
import type { Cfg } from '../project-base'
import type { RemoteStates } from '../remote_states'

const debug = Debug('cypress:server:controllers')

export = {

  async handleIframe (req: any, res: any, config: Cfg, remoteStates: RemoteStates, extraOptions: any) {
    const test = req.params[0]
    const iframePath: string = cwd('lib', 'html', 'iframe.html')
    const specFilter = _.get(extraOptions, 'specFilter')

    debug('handle iframe %o', { test, specFilter, config })

    const specs = await this.getSpecs(test, config, extraOptions)
    const supportFileJs = this.getSupportFile(config)
    const allFilesToSend = specs

    if (supportFileJs) {
      allFilesToSend.unshift(supportFileJs)
    }

    debug('all files to send %o', _.map(allFilesToSend, 'relative'))

    const injection = DocumentDomainInjection.InjectionBehavior(config)

    debug('primary remote state', remoteStates.getPrimary())
    const { origin } = remoteStates.getPrimary()

    const superDomain = injection.shouldInjectDocumentDomain(origin) ? injection.getHostname(origin) : ''

    const privilegedChannel = await privilegedCommandsManager.getPrivilegedChannel({
      browserFamily: req.query.browserFamily,
      isSpecBridge: false,
      namespace: config.namespace,
      scripts: allFilesToSend,
      url: req.proxiedUrl,
      documentDomainContext: injection.shouldInjectDocumentDomain(origin),
    })

    const iframeOptions = {
      superDomain,
      title: this.getTitle(test),
      scripts: JSON.stringify(allFilesToSend),
      privilegedChannel,
    }

    debug('iframe %s options %o', test, iframeOptions)

    res.render(iframePath, iframeOptions)
  },

  async handleCrossOriginIframe (req: any, res: any, config: Cfg) {
    const iframePath: string = cwd('lib', 'html', 'spec-bridge-iframe.html')
    const documentDomainInjection = DocumentDomainInjection.InjectionBehavior(config)
    const superDomain = documentDomainInjection.shouldInjectDocumentDomain(req.proxiedUrl) ?
      documentDomainInjection.getHostname(req.proxiedUrl) :
      undefined

    const { origin } = new URL(req.proxiedUrl)

    const privilegedChannel = await privilegedCommandsManager.getPrivilegedChannel({
      browserFamily: req.query.browserFamily,
      isSpecBridge: true,
      namespace: config.namespace,
      scripts: [],
      url: req.proxiedUrl,
      documentDomainContext: documentDomainInjection.shouldInjectDocumentDomain(req.proxiedUrl),
    })

    const iframeOptions = {
      superDomain,
      title: `Cypress for ${origin}`,
      namespace: config.namespace,
      privilegedChannel,
    }

    debug('cross origin iframe with options %o', iframeOptions)

    res.render(iframePath, iframeOptions)
  },

  getSpecs (spec: any, config: Cfg, extraOptions = {}) {
    // when asking for all specs: spec = "__all"
    // otherwise it is a relative spec filename like "integration/spec.js"
    debug('get specs %o', { spec, extraOptions })

    const convertSpecPath = (spec: any) => {
      // get the absolute path to this spec and
      // get the browser url + cache buster
      const convertedSpec = path.join(config.projectRoot, spec)

      debug('converted %s to %s', spec, convertedSpec)

      return this.prepareForBrowser(convertedSpec, config.projectRoot, config.namespace)
    }

    const getSpecsHelper = async () => {
      // grab all of the specs if this is ci
      if (spec === '__all') {
        debug('returning all specs')

        const ctx = getCtx()

        // In case the user clicked "run all specs" and deleted a spec in the list, we will
        // only include specs we know to exist
        const existingSpecs = new Set(ctx.project.specs.map(({ relative }) => relative))
        const filteredSpecs = ctx.project.runAllSpecs.reduce((acc: any, relSpec) => {
          if (existingSpecs.has(relSpec)) {
            acc.push(convertSpecPath(relSpec))
          }

          return acc
        }, [])

        return filteredSpecs
      }

      debug('normalizing spec %o', { spec })

      // normalize by sending in an array of 1
      return [convertSpecPath(spec)]
    }

    return getSpecsHelper()
  },

  prepareForBrowser (filePath: string, projectRoot: string, namespace: string) {
    const SPEC_URL_PREFIX = `/${namespace}/tests?p`

    filePath = filePath.replace(SPEC_URL_PREFIX, '__CYPRESS_SPEC_URL_PREFIX__')
    filePath = escapeFilenameInUrl(filePath).replace('__CYPRESS_SPEC_URL_PREFIX__', SPEC_URL_PREFIX)
    const relativeFilePath = path.relative(projectRoot, filePath)

    return {
      absolute: filePath,
      relative: relativeFilePath,
      relativeUrl: this.getTestUrl(relativeFilePath, namespace),
    }
  },

  getTestUrl (file: string, namespace: string) {
    const url = `/${namespace}/tests?p=${file}`

    debug('test url for file %o', { file, url })

    return url
  },

  getTitle (test: string) {
    if (test === '__all') {
      return 'All Tests'
    }

    return test
  },

  getSupportFile (config: Cfg) {
    const { projectRoot, supportFile, namespace } = config

    if (!supportFile) {
      return
    }

    return this.prepareForBrowser(supportFile, projectRoot, namespace)
  },
}
