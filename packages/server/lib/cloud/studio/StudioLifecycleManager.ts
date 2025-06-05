import { StudioManager } from './studio'
import { ProtocolManager } from '../protocol'
import Debug from 'debug'
import type { CloudDataSource } from '@packages/data-context/src/sources'
import type { Cfg } from '../../project-base'
import _ from 'lodash'
import type { DataContext } from '@packages/data-context'
import api from '../api'
import { reportStudioError } from '../api/studio/report_studio_error'
import { CloudRequest } from '../api/cloud_request'
import { isRetryableError } from '../network/is_retryable_error'
import { asyncRetry } from '../../util/async_retry'
import { postStudioSession } from '../api/studio/post_studio_session'
import type { StudioStatus } from '@packages/types'
import path from 'path'
import os from 'os'
import { ensureStudioBundle } from './ensure_studio_bundle'
import chokidar from 'chokidar'
import { readFile } from 'fs/promises'
import { getCloudMetadata } from '../get_cloud_metadata'
import { initializeTelemetryReporter, reportTelemetry } from './telemetry/TelemetryReporter'
import { telemetryManager } from './telemetry/TelemetryManager'
import { BUNDLE_LIFECYCLE_MARK_NAMES, BUNDLE_LIFECYCLE_TELEMETRY_GROUP_NAMES } from './telemetry/constants/bundle-lifecycle'
import { INITIALIZATION_TELEMETRY_GROUP_NAMES } from './telemetry/constants/initialization'

const debug = Debug('cypress:server:studio-lifecycle-manager')
const routes = require('../routes')

export class StudioLifecycleManager {
  private static hashLoadingMap: Map<string, Promise<void>> = new Map()
  private static watcher: chokidar.FSWatcher | null = null
  private studioManagerPromise?: Promise<StudioManager | null>
  private studioManager?: StudioManager
  private listeners: ((studioManager: StudioManager) => void)[] = []
  private ctx?: DataContext
  private lastStatus?: StudioStatus

  public get cloudStudioRequested () {
    return !!(process.env.CYPRESS_ENABLE_CLOUD_STUDIO || process.env.CYPRESS_LOCAL_STUDIO_PATH)
  }

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

    // Register this instance in the data context
    ctx.update((data) => {
      data.studioLifecycleManager = this
    })

    this.ctx = ctx

    this.updateStatus('INITIALIZING')

    const studioManagerPromise = this.createStudioManager({
      projectId,
      cloudDataSource,
      cfg,
      debugData,
    }).catch(async (error) => {
      debug('Error during studio manager setup: %o', error)

      const { cloudUrl, cloudHeaders } = await getCloudMetadata(cloudDataSource)

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

      this.updateStatus('IN_ERROR')

      // Clean up any registered listeners
      this.listeners = []

      telemetryManager.mark(BUNDLE_LIFECYCLE_MARK_NAMES.BUNDLE_LIFECYCLE_END)
      reportTelemetry(BUNDLE_LIFECYCLE_TELEMETRY_GROUP_NAMES.COMPLETE_BUNDLE_LIFECYCLE, {
        success: false,
      })

      return null
    })

    this.studioManagerPromise = studioManagerPromise

    this.setupWatcher({
      projectId,
      cloudDataSource,
      cfg,
      debugData,
    })
  }

  isStudioReady (): boolean {
    if (!this.studioManager) {
      telemetryManager.addGroupMetadata(INITIALIZATION_TELEMETRY_GROUP_NAMES.INITIALIZE_STUDIO, {
        studioRequestedBeforeReady: true,
      })
    }

    return !!this.studioManager
  }

  async getStudio () {
    if (!this.studioManagerPromise) {
      throw new Error('Studio manager has not been initialized')
    }

    const studioManager = await this.studioManagerPromise

    if (studioManager) {
      this.updateStatus(studioManager.status)
    }

    return studioManager
  }

  private async createStudioManager ({
    projectId,
    cloudDataSource,
    cfg,
    debugData,
  }: {
    projectId?: string
    cloudDataSource: CloudDataSource
    cfg: Cfg
    debugData: any
  }): Promise<StudioManager> {
    let studioPath: string
    let studioHash: string

    initializeTelemetryReporter({
      projectSlug: projectId,
      cloudDataSource,
    })

    telemetryManager.mark(BUNDLE_LIFECYCLE_MARK_NAMES.BUNDLE_LIFECYCLE_START)

    telemetryManager.mark(BUNDLE_LIFECYCLE_MARK_NAMES.POST_STUDIO_SESSION_START)
    const studioSession = await postStudioSession({
      projectId,
    })

    telemetryManager.mark(BUNDLE_LIFECYCLE_MARK_NAMES.POST_STUDIO_SESSION_END)

    telemetryManager.mark(BUNDLE_LIFECYCLE_MARK_NAMES.ENSURE_STUDIO_BUNDLE_START)
    if (!process.env.CYPRESS_LOCAL_STUDIO_PATH) {
      // The studio hash is the last part of the studio URL, after the last slash and before the extension
      studioHash = studioSession.studioUrl.split('/').pop()?.split('.')[0]
      studioPath = path.join(os.tmpdir(), 'cypress', 'studio', studioHash)

      let hashLoadingPromise = StudioLifecycleManager.hashLoadingMap.get(studioHash)

      if (!hashLoadingPromise) {
        hashLoadingPromise = ensureStudioBundle({
          studioUrl: studioSession.studioUrl,
          studioPath,
          projectId,
        })

        StudioLifecycleManager.hashLoadingMap.set(studioHash, hashLoadingPromise)
      }

      await hashLoadingPromise
    } else {
      studioPath = process.env.CYPRESS_LOCAL_STUDIO_PATH
      studioHash = 'local'
    }

    telemetryManager.mark(BUNDLE_LIFECYCLE_MARK_NAMES.ENSURE_STUDIO_BUNDLE_END)

    const serverFilePath = path.join(studioPath, 'server', 'index.js')

    const script = await readFile(serverFilePath, 'utf8')
    const studioManager = new StudioManager()

    telemetryManager.mark(BUNDLE_LIFECYCLE_MARK_NAMES.STUDIO_MANAGER_SETUP_START)

    const { cloudUrl, cloudHeaders } = await getCloudMetadata(cloudDataSource)

    await studioManager.setup({
      script,
      studioPath,
      studioHash,
      projectSlug: projectId,
      cloudApi: {
        cloudUrl,
        cloudHeaders,
        CloudRequest,
        isRetryableError,
        asyncRetry,
      },
      shouldEnableStudio: this.cloudStudioRequested,
    })

    telemetryManager.mark(BUNDLE_LIFECYCLE_MARK_NAMES.STUDIO_MANAGER_SETUP_END)

    if (studioManager.status === 'ENABLED') {
      debug('Cloud studio is enabled - setting up protocol')
      const protocolManager = new ProtocolManager()

      telemetryManager.mark(BUNDLE_LIFECYCLE_MARK_NAMES.STUDIO_PROTOCOL_GET_START)
      const script = await api.getCaptureProtocolScript(studioSession.protocolUrl)

      telemetryManager.mark(BUNDLE_LIFECYCLE_MARK_NAMES.STUDIO_PROTOCOL_GET_END)

      telemetryManager.mark(BUNDLE_LIFECYCLE_MARK_NAMES.STUDIO_PROTOCOL_PREPARE_START)
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

      telemetryManager.mark(BUNDLE_LIFECYCLE_MARK_NAMES.STUDIO_PROTOCOL_PREPARE_END)

      studioManager.protocolManager = protocolManager
    } else {
      debug('Cloud studio is not enabled - skipping protocol setup')
    }

    debug('Studio is ready')
    this.studioManager = studioManager
    this.callRegisteredListeners()
    this.updateStatus(studioManager.status)

    telemetryManager.mark(BUNDLE_LIFECYCLE_MARK_NAMES.BUNDLE_LIFECYCLE_END)
    reportTelemetry(BUNDLE_LIFECYCLE_TELEMETRY_GROUP_NAMES.COMPLETE_BUNDLE_LIFECYCLE, {
      success: true,
    })

    return studioManager
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

    if (!process.env.CYPRESS_LOCAL_STUDIO_PATH) {
      this.listeners = []
    }
  }

  private setupWatcher ({
    projectId,
    cloudDataSource,
    cfg,
    debugData,
  }: {
    projectId?: string
    cloudDataSource: CloudDataSource
    cfg: Cfg
    debugData: any
  }) {
    // Don't setup a watcher if the studio bundle is NOT local
    if (!process.env.CYPRESS_LOCAL_STUDIO_PATH) {
      return
    }

    // Close the watcher if a previous watcher exists
    if (StudioLifecycleManager.watcher) {
      StudioLifecycleManager.watcher.removeAllListeners()
      StudioLifecycleManager.watcher.close().catch(() => {})
    }

    // Watch for changes to the studio bundle
    StudioLifecycleManager.watcher = chokidar.watch(path.join(process.env.CYPRESS_LOCAL_STUDIO_PATH, 'server', 'index.js'), {
      awaitWriteFinish: true,
    }).on('change', async () => {
      await this.studioManager?.destroy()
      this.studioManager = undefined
      this.studioManagerPromise = this.createStudioManager({
        projectId,
        cloudDataSource,
        cfg,
        debugData,
      }).catch((error) => {
        debug('Error during reload of studio manager: %o', error)

        return null
      })
    })
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

      // If the studio bundle is local, we need to register the listener
      // so that we can reload the studio when the bundle changes
      if (process.env.CYPRESS_LOCAL_STUDIO_PATH) {
        this.listeners.push(listener)
      }
    } else {
      debug('Studio not ready - registering studio ready listener')
      this.listeners.push(listener)
    }
  }

  public updateStatus (status: StudioStatus) {
    if (status === this.lastStatus) {
      debug('Studio status unchanged: %s', status)

      return
    }

    debug('Studio status changed: %s → %s', this.lastStatus, status)
    this.lastStatus = status

    if (this.ctx) {
      this.ctx?.emitter.studioStatusChange()
    } else {
      debug('No ctx available, cannot emit studioStatusChange')
    }
  }
}
