import { CyPromptManager } from './CyPromptManager'
import Debug from 'debug'
import type { CloudDataSource } from '@packages/data-context/src/sources'
import type { DataContext } from '@packages/data-context'
import { CloudRequest, createCloudRequest } from '../api/cloud_request'
import { isRetryableError } from '../network/is_retryable_error'
import { asyncRetry } from '../../util/async_retry'
import { postCyPromptSession } from '../api/cy-prompt/post_cy_prompt_session'
import path from 'path'
import os from 'os'
import { readFile } from 'fs-extra'
import { ensureCyPromptBundle } from './ensure_cy_prompt_bundle'
import chokidar from 'chokidar'
import { getCloudMetadata } from '../get_cloud_metadata'
import type { CyPromptAuthenticatedUserShape, CyPromptServerOptions } from '@packages/types'
import crypto from 'crypto'
import { reportCyPromptError } from '../api/cy-prompt/report_cy_prompt_error'

const debug = Debug('cypress:server:cy-prompt-lifecycle-manager')

export class CyPromptLifecycleManager {
  private static hashLoadingMap: Map<string, Promise<Record<string, string>>> = new Map()
  private static watcher: chokidar.FSWatcher | null = null
  private cyPromptManagerPromise?: Promise<{
    cyPromptManager?: CyPromptManager
    error?: Error
  }>

  private cyPromptManager?: CyPromptManager
  private listeners: ((cyPromptManager: CyPromptManager) => void)[] = []
  private cyPromptHash: string | undefined

  /**
   * Initialize the cy prompt manager.
   * Also registers this instance in the data context.
   * @param projectId The project ID
   * @param cloudDataSource The cloud data source
   * @param ctx Data context to register this instance with
   */
  initializeCyPromptManager ({
    cloudDataSource,
    ctx,
    record,
    key,
  }: {
    cloudDataSource: CloudDataSource
    ctx: DataContext
    record?: boolean
    key?: string
  }): void {
    // Register this instance in the data context
    ctx.update((data) => {
      data.cyPromptLifecycleManager = this
    })

    const recordingInfo = {
      get runId () {
        return ctx.coreData.currentRecordingInfo.runId
      },
      get instanceId () {
        return ctx.coreData.currentRecordingInfo.instanceId
      },
    }

    const getProjectOptions = async () => {
      const [user, config] = await Promise.all([
        ctx.actions.auth.authApi.getUser(),
        ctx.project.getConfig(),
      ])

      return {
        user,
        projectSlug: config.projectId || undefined,
        record,
        key,
        isOpenMode: ctx.isOpenMode,
        ...(record ? { recordingInfo } : {}),
      }
    }

    const cyPromptManagerPromise = this.createCyPromptManager({
      cloudDataSource,
      getProjectOptions,
    }).catch(async (error) => {
      debug('Error during cy prompt manager setup: %o', error)

      const cloudEnv = (process.env.CYPRESS_CONFIG_ENV || process.env.CYPRESS_INTERNAL_ENV || 'production') as 'development' | 'staging' | 'production'
      const cloudUrl = ctx.cloud.getCloudUrl(cloudEnv)
      const cloudHeaders = await ctx.cloud.additionalHeaders()

      reportCyPromptError({
        cloudApi: {
          cloudUrl,
          CloudRequest,
          createCloudRequest,
          isRetryableError,
          asyncRetry,
        },
        additionalHeaders: cloudHeaders,
        cyPromptHash: this.cyPromptHash,
        projectSlug: (await ctx.project.getConfig()).projectId || undefined,
        error,
        cyPromptMethod: 'initializeCyPromptManager',
        cyPromptMethodArgs: [],
      })

      // Clean up any registered listeners
      this.listeners = []

      const lastError = error instanceof AggregateError ? error.errors[error.errors.length - 1] : error

      return { error: lastError }
    })

    this.cyPromptManagerPromise = cyPromptManagerPromise

    this.setupWatcher({
      cloudDataSource,
      getProjectOptions,
    })
  }

  async getCyPrompt () {
    if (!this.cyPromptManagerPromise) {
      throw new Error('cy prompt manager has not been initialized')
    }

    const cyPromptManager = await this.cyPromptManagerPromise

    return cyPromptManager
  }

  private async createCyPromptManager ({
    cloudDataSource,
    getProjectOptions,
  }: {
    projectId?: string
    cloudDataSource: CloudDataSource
    getProjectOptions: CyPromptServerOptions['getProjectOptions']
  }): Promise<{ cyPromptManager?: CyPromptManager, error?: Error }> {
    let cyPromptPath: string
    let manifest: Record<string, string>

    const currentProjectOptions = await getProjectOptions()
    const projectId = currentProjectOptions.projectSlug
    const cyPromptSession = await postCyPromptSession({
      projectId: currentProjectOptions.projectSlug,
    })

    if (!process.env.CYPRESS_LOCAL_CY_PROMPT_PATH) {
      // The cy prompt hash is the last part of the cy prompt URL, after the last slash and before the extension
      this.cyPromptHash = cyPromptSession.cyPromptUrl.split('/').pop()?.split('.')[0] as string
      cyPromptPath = path.join(os.tmpdir(), 'cypress', 'cy-prompt', this.cyPromptHash)

      let hashLoadingPromise = CyPromptLifecycleManager.hashLoadingMap.get(this.cyPromptHash)

      if (!hashLoadingPromise) {
        hashLoadingPromise = ensureCyPromptBundle({
          cyPromptUrl: cyPromptSession.cyPromptUrl,
          projectId,
          cyPromptPath,
        })

        CyPromptLifecycleManager.hashLoadingMap.set(this.cyPromptHash, hashLoadingPromise)
      }

      manifest = await hashLoadingPromise
    } else {
      cyPromptPath = process.env.CYPRESS_LOCAL_CY_PROMPT_PATH
      this.cyPromptHash = 'local'
      manifest = {}
    }

    const serverFilePath = path.join(cyPromptPath, 'server', 'index.js')

    const script = await readFile(serverFilePath, 'utf8')

    if (!process.env.CYPRESS_LOCAL_CY_PROMPT_PATH) {
      const expectedHash = manifest[path.posix.join('server', 'index.js')]
      const actualHash = crypto.createHash('sha256').update(script).digest('hex')

      if (!expectedHash) {
        throw new Error('Expected hash for cy prompt server script not found in manifest')
      }

      if (actualHash !== expectedHash) {
        throw new Error('Invalid hash for cy prompt server script')
      }
    }

    const cyPromptManager = new CyPromptManager()

    const { cloudUrl } = await getCloudMetadata(cloudDataSource)

    await cyPromptManager.setup({
      script,
      cyPromptPath,
      cyPromptHash: this.cyPromptHash,
      cloudApi: {
        cloudUrl,
        CloudRequest,
        createCloudRequest,
        isRetryableError,
        asyncRetry,
      },
      getProjectOptions,
      manifest,
    })

    debug('cy prompt is ready')
    this.cyPromptManager = cyPromptManager
    this.callRegisteredListeners()

    return { cyPromptManager }
  }

  private callRegisteredListeners () {
    if (!this.cyPromptManager) {
      throw new Error('cy prompt manager has not been initialized')
    }

    const cyPromptManager = this.cyPromptManager

    debug('Calling all cy prompt ready listeners')
    this.listeners.forEach((listener) => {
      listener(cyPromptManager)
    })

    if (!process.env.CYPRESS_LOCAL_CY_PROMPT_PATH) {
      this.listeners = []
    }
  }

  private setupWatcher ({
    projectId,
    cloudDataSource,
    getProjectOptions,
  }: {
    projectId?: string
    cloudDataSource: CloudDataSource
    getProjectOptions: () => Promise<{
      user?: CyPromptAuthenticatedUserShape
      projectSlug?: string
      record?: boolean
      key?: string
    }>
  }) {
    // Don't setup a watcher if the cy prompt bundle is NOT local
    if (!process.env.CYPRESS_LOCAL_CY_PROMPT_PATH) {
      return
    }

    // Close the watcher if a previous watcher exists
    if (CyPromptLifecycleManager.watcher) {
      CyPromptLifecycleManager.watcher.removeAllListeners()
      CyPromptLifecycleManager.watcher.close().catch(() => {})
    }

    // Watch for changes to the cy prompt bundle
    CyPromptLifecycleManager.watcher = chokidar.watch(path.join(process.env.CYPRESS_LOCAL_CY_PROMPT_PATH, 'server', 'index.js'), {
      awaitWriteFinish: true,
    }).on('change', async () => {
      this.cyPromptManager = undefined
      this.cyPromptManagerPromise = this.createCyPromptManager({
        projectId,
        cloudDataSource,
        getProjectOptions,
      }).catch((error) => {
        debug('Error during reload of cy prompt manager: %o', error)

        return {
          cyPromptManager: undefined,
          error: new Error('Error during reload of cy prompt manager'),
        }
      })
    })
  }

  /**
   * Register a listener that will be called when the cy prompt manager is ready
   * @param listener Function to call when cy prompt manager is ready
   */
  registerCyPromptReadyListener (listener: (cyPromptManager: CyPromptManager) => void): void {
    // if there is already a cy prompt manager, call the listener immediately
    if (this.cyPromptManager) {
      debug('cy prompt ready - calling listener immediately')
      listener(this.cyPromptManager)

      // If the cy prompt bundle is local, we need to register the listener
      // so that we can reload the cy prompt when the bundle changes
      if (process.env.CYPRESS_LOCAL_CY_PROMPT_PATH) {
        this.listeners.push(listener)
      }
    } else {
      debug('cy prompt not ready - registering cy prompt ready listener')
      this.listeners.push(listener)
    }
  }
}
