import type { StudioManager } from './cloud/studio'
import { ProtocolManager } from './cloud/protocol'
import { getAndInitializeStudioManager } from './cloud/api/studio/get_and_initialize_studio_manager'
import Debug from 'debug'
import type { CloudDataSource } from '@packages/data-context/src/sources'
import type { Cfg } from './project-base'
import _ from 'lodash'
import type { DataContext } from '@packages/data-context'
import api from './cloud/api'
import { reportStudioError } from './cloud/api/studio/report_studio_error'
import { CloudRequest } from './cloud/api/cloud_request'
import { isRetryableError } from './cloud/network/is_retryable_error'
import { asyncRetry } from './util/async_retry'
const debug = Debug('cypress:server:studio-lifecycle-manager')
const routes = require('./cloud/routes')

export class StudioLifecycleManager {
  private studioManagerPromise?: Promise<StudioManager | null>
  private studioManager?: StudioManager
  private listeners: ((studioManager: StudioManager) => void)[] = []
  /**
   * Initialize the studio manager and possibly set up protocol.
   * Also registers this instance in the data context.
   * @param projectId The project ID
   * @param cloudDataSource The cloud data source
   * @param cfg The project configuration
   * @param debugData Debug data for the configuration
   * @param ctx Data context to register this instance with
   */
  initializeStudioManager ({
    projectId,
    cloudDataSource,
    cfg,
    debugData,
    ctx,
  }: {
    projectId?: string
    cloudDataSource: CloudDataSource
    cfg: Cfg
    debugData: any
    ctx: DataContext
  }): void {
    debug('Initializing studio manager')

    const studioManagerPromise = getAndInitializeStudioManager({
      projectId,
      cloudDataSource,
    }).then(async (studioManager) => {
      if (studioManager.status === 'ENABLED') {
        debug('Cloud studio is enabled - setting up protocol')
        const protocolManager = new ProtocolManager()
        const protocolUrl = routes.apiRoutes.captureProtocolCurrent()
        const script = await api.getCaptureProtocolScript(protocolUrl)

        await protocolManager.prepareProtocol(script, {
          runId: 'studio',
          projectId: cfg.projectId,
          testingType: cfg.testingType,
          cloudApi: {
            url: routes.apiUrl,
            retryWithBackoff: api.retryWithBackoff,
            requestPromise: api.rp,
          },
          projectConfig: _.pick(cfg, ['devServerPublicPathRoute', 'port', 'proxyUrl', 'namespace']),
          mountVersion: api.runnerCapabilities.protocolMountVersion,
          debugData,
          mode: 'studio',
        })

        studioManager.protocolManager = protocolManager
      } else {
        debug('Cloud studio is not enabled - skipping protocol setup')
      }

      debug('Studio is ready')
      this.studioManager = studioManager
      this.callRegisteredListeners()

      return studioManager
    }).catch(async (error) => {
      debug('Error during studio manager setup: %o', error)

      const cloudEnv = (process.env.CYPRESS_INTERNAL_ENV || 'production') as 'development' | 'staging' | 'production'
      const cloudUrl = ctx.cloud.getCloudUrl(cloudEnv)
      const cloudHeaders = await ctx.cloud.additionalHeaders()

      reportStudioError({
        cloudApi: {
          cloudUrl,
          cloudHeaders,
          CloudRequest,
          isRetryableError,
          asyncRetry,
        },
        studioHash: projectId,
        projectSlug: cfg.projectId,
        error,
        studioMethod: 'initializeStudioManager',
        studioMethodArgs: [],
      })

      // Clean up any registered listeners
      this.listeners = []

      return null
    })

    this.studioManagerPromise = studioManagerPromise

    // Register this instance in the data context
    ctx.update((data) => {
      data.studioLifecycleManager = this
    })
  }

  isStudioReady (): boolean {
    return !!this.studioManager
  }

  async getStudio () {
    if (!this.studioManagerPromise) {
      throw new Error('Studio manager has not been initialized')
    }

    return await this.studioManagerPromise
  }

  private callRegisteredListeners () {
    if (!this.studioManager) {
      throw new Error('Studio manager has not been initialized')
    }

    const studioManager = this.studioManager

    debug('Calling all studio ready listeners')
    this.listeners.forEach((listener) => {
      listener(studioManager)
    })

    this.listeners = []
  }

  /**
   * Register a listener that will be called when the studio is ready
   * @param listener Function to call when studio is ready
   */
  registerStudioReadyListener (listener: (studioManager: StudioManager) => void): void {
    // if there is already a studio manager, call the listener immediately
    if (this.studioManager) {
      debug('Studio ready - calling listener immediately')
      listener(this.studioManager)
    } else {
      debug('Studio not ready - registering studio ready listener')
      this.listeners.push(listener)
    }
  }
}
