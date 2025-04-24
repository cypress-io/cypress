import { EventEmitter } from 'stream'
import type { StudioManager } from './cloud/studio'
import { ProtocolManager } from './cloud/protocol'
import { getAndInitializeStudioManager } from './cloud/api/studio/get_and_initialize_studio_manager'
import Debug from 'debug'
import type { CloudDataSource } from '@packages/data-context/src/sources'
import type { Cfg } from './project-base'
import _ from 'lodash'
import type { DataContext } from '@packages/data-context'
import api from './cloud/api'

const debug = Debug('cypress:server:studio-lifecycle-manager')
const routes = require('./cloud/routes')

export class StudioLifecycleManager extends EventEmitter {
  private studioManagerPromise: Promise<StudioManager | null> | null = null
  private studioReady = false
  private static readonly STUDIO_READY_EVENT = 'studio:ready'

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
        debug('Studio manager enabled, setting up protocol')
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
        studioManager.isProtocolEnabled = true
      }

      return studioManager
    }).catch((err) => {
      debug('Error during studio manager setup: %o', err)

      return null
    })

    this.studioManagerPromise = studioManagerPromise

    // When the promise resolves, emit the studio:ready event with the studio manager
    void studioManagerPromise.then((studioManager) => {
      this.studioReady = true
      this.emit(StudioLifecycleManager.STUDIO_READY_EVENT, studioManager)
    })

    // Register this instance in the data context
    ctx.update((data) => {
      data.studioLifecycleManager = this
    })
  }

  isStudioReady (): boolean {
    return this.studioReady
  }

  async getStudio () {
    if (!this.studioManagerPromise) {
      throw new Error('Studio manager has not been initialized')
    }

    return await this.studioManagerPromise
  }

  /**
   * Register a listener that will be called when the studio is ready
   * @param listener Function to call when studio is ready
   * @returns Function to remove the listener
   */
  onStudioReady (listener: (studioManager: StudioManager) => void): () => void {
    // Use once instead of on to ensure the listener only fires once
    this.once(StudioLifecycleManager.STUDIO_READY_EVENT, listener)

    // If studio is already ready, call the listener immediately and only once
    if (this.studioManagerPromise) {
      void this.studioManagerPromise.then((studioManager) => {
        // Remove the listener first to prevent it from being called twice
        this.off(StudioLifecycleManager.STUDIO_READY_EVENT, listener)
        // Only call listener if studioManager is not null
        if (studioManager) {
          listener(studioManager)
        }
      })
    }

    // Return a function to remove the listener
    return () => {
      this.off(StudioLifecycleManager.STUDIO_READY_EVENT, listener)
    }
  }
}
