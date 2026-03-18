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
import type { StudioServerOptions, StudioStatus } from '@packages/types'
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
import crypto from 'crypto'
import { logError } from '@packages/stderr-filtering'
import { isNonRetriableCertErrorCode } from '../network/non_retriable_cert_error_codes'
import type { DebugData } from '@packages/types'

const debug = Debug('cypress:server:studio-lifecycle-manager')
const routes = require('../routes')

export class StudioLifecycleManager {
  private static hashLoadingMap: Map<string, Promise<Record<string, string>>> = new Map()
  private static watcher: chokidar.FSWatcher | null = null
  private studioManagerPromise?: Promise<StudioManager | null>
  private studioManager?: StudioManager
  private listeners: ((studioManager: StudioManager) => void)[] = []
  private ctx?: DataContext
  private lastStatus?: StudioStatus
  private lastErrorCode?: string
  private currentStudioHash?: string

  private initializationParams?: {
    cloudDataSource: CloudDataSource
    cfg: Cfg
    debugData: any
    ctx: DataContext
  }

  /**
   * Initialize the studio manager and possibly set up protocol.
   * Also registers this instance in the data context.
   * @param cloudDataSource The cloud data source
   * @param cfg The project configuration
   * @param debugData Debug data for the configuration
   * @param ctx Data context to register this instance with
   */
  initializeStudioManager ({
    cloudDataSource,
    cfg,
    debugData,
    ctx,
  }: {
    cloudDataSource: CloudDataSource
    cfg: Cfg
    debugData: any
    ctx: DataContext
  }): void {
    debug('Initializing studio manager')

    // Store initialization parameters for retry
    this.initializationParams = { cloudDataSource, cfg, debugData, ctx }

    // Register this instance in the data context
    ctx.update((data) => {
      data.studioLifecycleManager = this
    })

    this.ctx = ctx

    this.updateStatus('INITIALIZING')

    const getProjectOptions = async () => {
      const [user, config] = await Promise.all([
        ctx.actions.auth.authApi.getUser(),
        ctx.project.getConfig(),
      ])

      return {
        user,
        projectSlug: config.projectId || undefined,
      }
    }

    const studioManagerPromise = this.createStudioManager({
      cloudDataSource,
      cfg,
      debugData,
      getProjectOptions,
    }).catch(async (error) => {
      debug('Error during studio manager setup: %o', error)

      try {
        const { cloudUrl, cloudHeaders } = await getCloudMetadata(cloudDataSource)

        reportStudioError({
          cloudApi: {
            cloudUrl,
            cloudHeaders,
            CloudRequest,
            isRetryableError,
            asyncRetry,
          },
          studioHash: this.currentStudioHash,
          projectSlug: (await getProjectOptions()).projectSlug,
          error,
          studioMethod: 'initializeStudioManager',
          studioMethodArgs: [],
        })

        this.updateStatus('IN_ERROR', error)

        telemetryManager.mark(BUNDLE_LIFECYCLE_MARK_NAMES.BUNDLE_LIFECYCLE_END)
        reportTelemetry(BUNDLE_LIFECYCLE_TELEMETRY_GROUP_NAMES.COMPLETE_BUNDLE_LIFECYCLE, {
          success: false,
        })
      } catch (error) {
        debug('Error reporting studio error: %o', error)
      }

      return null
    })

    this.studioManagerPromise = studioManagerPromise

    this.setupWatcher({
      cloudDataSource,
      cfg,
      debugData,
      getProjectOptions,
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
    cloudDataSource,
    cfg,
    debugData,
    getProjectOptions,
  }: {
    cloudDataSource: CloudDataSource
    cfg: Cfg
    debugData?: DebugData
    getProjectOptions: Required<StudioServerOptions>['getProjectOptions']
  }): Promise<StudioManager> {
    let studioPath: string
    let manifest: Record<string, string>

    const currentProjectOptions = await getProjectOptions()

    initializeTelemetryReporter({
      projectSlug: currentProjectOptions.projectSlug,
      cloudDataSource,
    })

    telemetryManager.mark(BUNDLE_LIFECYCLE_MARK_NAMES.BUNDLE_LIFECYCLE_START)

    telemetryManager.mark(BUNDLE_LIFECYCLE_MARK_NAMES.POST_STUDIO_SESSION_START)
    const studioSession = await postStudioSession({
      projectId: currentProjectOptions.projectSlug,
    })

    telemetryManager.mark(BUNDLE_LIFECYCLE_MARK_NAMES.POST_STUDIO_SESSION_END)

    telemetryManager.mark(BUNDLE_LIFECYCLE_MARK_NAMES.ENSURE_STUDIO_BUNDLE_START)
    if (!process.env.CYPRESS_LOCAL_STUDIO_PATH) {
      // The studio hash is the last part of the studio URL, after the last slash and before the extension
      const studioHash = studioSession.studioUrl.split('/').pop()?.split('.')[0] as string

      studioPath = path.join(os.tmpdir(), 'cypress', 'studio', studioHash)

      debug('Setting current studio hash: %s', studioHash)
      // Store the current studio hash so that we can clear the cache entry when retrying
      this.currentStudioHash = studioHash

      let hashLoadingPromise = StudioLifecycleManager.hashLoadingMap.get(studioHash)

      if (!hashLoadingPromise) {
        debug('Ensuring studio bundle for hash: %s', studioHash)

        hashLoadingPromise = ensureStudioBundle({
          studioUrl: studioSession.studioUrl,
          studioPath,
          projectId: currentProjectOptions.projectSlug,
        })

        StudioLifecycleManager.hashLoadingMap.set(studioHash, hashLoadingPromise)
      }

      manifest = await hashLoadingPromise

      debug('Manifest: %o', manifest)
    } else {
      studioPath = process.env.CYPRESS_LOCAL_STUDIO_PATH
      this.currentStudioHash = 'local'
      manifest = {}
    }

    telemetryManager.mark(BUNDLE_LIFECYCLE_MARK_NAMES.ENSURE_STUDIO_BUNDLE_END)

    const serverFilePath = path.join(studioPath, 'server', 'index.js')

    const studioScript = await readFile(serverFilePath, 'utf8')

    if (!process.env.CYPRESS_LOCAL_STUDIO_PATH) {
      const expectedHash = manifest['server/index.js']
      const actualHash = crypto.createHash('sha256').update(studioScript).digest('hex')

      if (!expectedHash) {
        debug('Expected hash %s for studio server script not found in manifest: %o', expectedHash, manifest)

        throw new Error('Expected hash for studio server script not found in manifest')
      }

      if (actualHash !== expectedHash) {
        debug('Invalid hash for studio server script: %s !== %s', actualHash, expectedHash)

        throw new Error('Invalid hash for studio server script')
      }
    }

    const studioManager = new StudioManager()

    telemetryManager.mark(BUNDLE_LIFECYCLE_MARK_NAMES.STUDIO_MANAGER_SETUP_START)

    const { cloudUrl, cloudHeaders } = await getCloudMetadata(cloudDataSource)

    await studioManager.setup({
      script: studioScript,
      studioPath,
      studioHash: this.currentStudioHash,
      cloudApi: {
        cloudUrl,
        cloudHeaders,
        CloudRequest,
        isRetryableError,
        asyncRetry,
      },
      manifest,
      getProjectOptions,
      debugData,
    })

    telemetryManager.mark(BUNDLE_LIFECYCLE_MARK_NAMES.STUDIO_MANAGER_SETUP_END)

    debug('Cloud studio is enabled - setting up protocol')
    const protocolManager = new ProtocolManager()

    telemetryManager.mark(BUNDLE_LIFECYCLE_MARK_NAMES.STUDIO_PROTOCOL_GET_START)
    const protocolScript = await api.getCaptureProtocolScript(studioSession.protocolUrl, { displayRetryErrors: false })

    telemetryManager.mark(BUNDLE_LIFECYCLE_MARK_NAMES.STUDIO_PROTOCOL_GET_END)

    telemetryManager.mark(BUNDLE_LIFECYCLE_MARK_NAMES.STUDIO_PROTOCOL_PREPARE_START)
    await protocolManager.prepareProtocol(protocolScript, {
      runId: 'studio',
      projectId: currentProjectOptions.projectSlug,
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

    debug('Calling %d studio ready listeners', this.listeners.length)
    this.listeners.forEach((listener) => {
      listener(studioManager)
    })

    // In local development, keep listeners so they can be called again after Studio reloads
    if (!process.env.CYPRESS_LOCAL_STUDIO_PATH) {
      debug('Clearing %d studio ready listeners after successful initialization', this.listeners.length)
      this.listeners = []
    }
  }

  private setupWatcher ({
    cloudDataSource,
    cfg,
    debugData,
    getProjectOptions,
  }: {
    cloudDataSource: CloudDataSource
    cfg: Cfg
    debugData?: DebugData
    getProjectOptions: Required<StudioServerOptions>['getProjectOptions']
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
        cloudDataSource,
        cfg,
        debugData,
        getProjectOptions,
      }).then((studioManager) => {
        // eslint-disable-next-line no-console
        console.log('Studio manager reloaded')

        return studioManager
      }).catch((error) => {
        logError('Error during reload of studio manager: %o', error)

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

  public getCurrentStatus (): StudioStatus | undefined {
    return this.lastStatus
  }

  public getIsCertError (): boolean {
    return !!(this.lastStatus === 'IN_ERROR' && this.lastErrorCode && isNonRetriableCertErrorCode(this.lastErrorCode))
  }

  public retry (): void {
    if (!this.ctx) {
      debug('No ctx available, cannot retry studio initialization')

      return
    }

    debug('Retrying studio initialization')

    this.studioManager = undefined
    this.studioManagerPromise = undefined
    this.lastStatus = undefined
    this.lastErrorCode = undefined

    // Clear the cache entry for the current studio hash
    if (this.currentStudioHash) {
      const hadCachedPromise = StudioLifecycleManager.hashLoadingMap.has(this.currentStudioHash)

      StudioLifecycleManager.hashLoadingMap.delete(this.currentStudioHash)
      debug('Cleared cached studio bundle promise for hash: %s (was cached: %s)', this.currentStudioHash, hadCachedPromise)
      this.currentStudioHash = undefined
    } else {
      debug('No current studio hash available to clear from cache')
    }

    // Re-initialize with the same parameters we stored
    if (this.initializationParams) {
      this.initializeStudioManager(this.initializationParams)
    } else {
      debug('No initialization parameters available for retry')
      this.updateStatus('IN_ERROR')
    }
  }

  public updateStatus (status: StudioStatus, error?: any) {
    if (status === this.lastStatus) {
      debug('Studio status unchanged: %s', status)

      return
    }

    debug('Studio status changed: %s → %s', this.lastStatus, status)
    this.lastStatus = status

    if (error instanceof AggregateError) {
      const errors = (error as AggregateError).errors

      this.lastErrorCode = errors[errors.length - 1]?.code ?? undefined
    } else {
      this.lastErrorCode = error?.code ?? undefined
    }

    if (this.ctx) {
      this.ctx?.emitter.studioStatusChange()
    } else {
      debug('No ctx available, cannot emit studioStatusChange')
    }
  }
}
