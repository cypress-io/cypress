import { CyPromptManager } from './CyPromptManager'
import Debug from 'debug'
import type { CloudDataSource } from '@packages/data-context/src/sources'
import type { DataContext } from '@packages/data-context'
import { CloudRequest } from '../api/cloud_request'
import { isRetryableError } from '../network/is_retryable_error'
import { asyncRetry } from '../../util/async_retry'
import { postCyPromptSession } from '../api/cy-prompt/post_cy_prompt_session'
import path from 'path'
import os from 'os'
import { readFile } from 'fs-extra'
import { ensureCyPromptBundle } from './ensure_cy_prompt_bundle'

const debug = Debug('cypress:server:cy-prompt-lifecycle-manager')

export class CyPromptLifecycleManager {
  private cyPromptManagerPromise?: Promise<CyPromptManager | null>
  private cyPromptManager?: CyPromptManager
  private listeners: ((cyPromptManager: CyPromptManager) => void)[] = []

  /**
   * Initialize the cy prompt manager.
   * Also registers this instance in the data context.
   * @param projectId The project ID
   * @param cloudDataSource The cloud data source
   * @param ctx Data context to register this instance with
   */
  initializeCyPromptManager ({
    projectId,
    cloudDataSource,
    ctx,
  }: {
    projectId: string
    cloudDataSource: CloudDataSource
    ctx: DataContext
  }): void {
    // Register this instance in the data context
    ctx.update((data) => {
      data.cyPromptLifecycleManager = this
    })

    const cyPromptManagerPromise = this.createCyPromptManager({
      projectId,
      cloudDataSource,
    }).catch(async (error) => {
      debug('Error during cy prompt manager setup: %o', error)

      // const cloudEnv = (process.env.CYPRESS_CONFIG_ENV || process.env.CYPRESS_INTERNAL_ENV || 'production') as 'development' | 'staging' | 'production'
      // const cloudUrl = ctx.cloud.getCloudUrl(cloudEnv)
      // const cloudHeaders = await ctx.cloud.additionalHeaders()

      // TODO: reportCyPromptError
      // reportCyPromptError({
      //   cloudApi: {
      //     cloudUrl,
      //     cloudHeaders,
      //     CloudRequest,
      //     isRetryableError,
      //     asyncRetry,
      //   },
      //   cyPromptHash: projectId,
      //   projectSlug: cfg.projectId,
      //   error,
      //   cyPromptMethod: 'initializeCyPromptManager',
      //   cyPromptMethodArgs: [],
      // })

      // Clean up any registered listeners
      this.listeners = []

      return null
    })

    this.cyPromptManagerPromise = cyPromptManagerPromise
  }

  async getCyPrompt () {
    if (!this.cyPromptManagerPromise) {
      throw new Error('cy prompt manager has not been initialized')
    }

    const cyPromptManager = await this.cyPromptManagerPromise

    return cyPromptManager
  }

  private async createCyPromptManager ({
    projectId,
    cloudDataSource,
  }: {
    projectId: string
    cloudDataSource: CloudDataSource
  }): Promise<CyPromptManager> {
    const cyPromptSession = await postCyPromptSession({
      projectId,
    })

    // The cy prompt hash is the last part of the cy prompt URL, after the last slash and before the extension
    const cyPromptHash = cyPromptSession.cyPromptUrl.split('/').pop()?.split('.')[0]
    const cyPromptPath = path.join(os.tmpdir(), 'cypress', 'cy-prompt', cyPromptHash)
    const bundlePath = path.join(cyPromptPath, 'bundle.tar')
    const serverFilePath = path.join(cyPromptPath, 'server', 'index.js')

    await ensureCyPromptBundle({
      cyPromptUrl: cyPromptSession.cyPromptUrl,
      projectId,
      cyPromptPath,
      bundlePath,
    })

    const script = await readFile(serverFilePath, 'utf8')
    const cyPromptManager = new CyPromptManager()

    const cloudEnv = (process.env.CYPRESS_CONFIG_ENV || process.env.CYPRESS_INTERNAL_ENV || 'production') as 'development' | 'staging' | 'production'
    const cloudUrl = cloudDataSource.getCloudUrl(cloudEnv)
    const cloudHeaders = await cloudDataSource.additionalHeaders()

    await cyPromptManager.setup({
      script,
      cyPromptPath,
      cyPromptHash,
      projectSlug: projectId,
      cloudApi: {
        cloudUrl,
        cloudHeaders,
        CloudRequest,
        isRetryableError,
        asyncRetry,
      },
    })

    debug('cy prompt is ready')
    this.cyPromptManager = cyPromptManager
    this.callRegisteredListeners()

    return cyPromptManager
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

    this.listeners = []
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
    } else {
      debug('cy prompt not ready - registering cy prompt ready listener')
      this.listeners.push(listener)
    }
  }
}
