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

export class StudioLifecycleManager {
  private studioManagerPromise: Promise<StudioManager | null> | null = null
  private studioReady = false
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
        studioManager.isProtocolEnabled = true
      } else {
        debug('Cloud studio is not enabled - skipping protocol setup')
      }

      return studioManager
    }).catch((err) => {
      debug('Error during studio manager setup: %o', err)

      return null
    })

    this.studioManagerPromise = studioManagerPromise

    // When the promise resolves, call all the listeners
    void studioManagerPromise.then(() => {
      debug('Studio is ready')
      this.studioReady = true
      this.callRegisteredListeners()
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

  private callRegisteredListeners (listener?: ((studioManager: StudioManager) => void)) {
    if (!this.studioManagerPromise || !this.studioReady) {
      throw new Error('Studio manager has not been initialized')
    }

    void this.studioManagerPromise.then((studioManager) => {
      if (studioManager) {
        // if we were passed a listener, just call that one
        if (listener) {
          listener(studioManager)
        } else {
          // otherwise, call all the listeners
          debug('Calling all studio ready listeners')
          this.listeners.forEach((listener) => {
            listener(studioManager)
          })

          this.listeners = []
        }
      }
    })
  }

  /**
   * Register a listener that will be called when the studio is ready
   * @param listener Function to call when studio is ready
   */
  registerStudioReadyListener (listener: (studioManager: StudioManager) => void): void {
    // if studio is already ready and there is a studio manager, call the listener immediately and only once
    if (this.studioReady && this.studioManagerPromise) {
      this.callRegisteredListeners(listener)
    } else {
      // otherwise, keep track of the listener and call it when the studio is ready
      this.listeners.push(listener)
    }
  }
}
