import type { CyPromptManagerShape, CyPromptStatus, CyPromptServerDefaultShape, CyPromptServerShape, CyPromptCloudApi, CyPromptCDPClient, CyPromptAddSocketListenerOptions, CyPromptServerOptions } from '@packages/types'
import type { Router } from 'express'
import Debug from 'debug'
import { requireScript } from '../require_script'
import crypto, { BinaryLike } from 'crypto'

interface CyPromptServer { default: CyPromptServerDefaultShape }

interface SetupOptions {
  script: string
  cyPromptPath: string
  cyPromptHash?: string
  projectSlug?: string
  cloudApi: CyPromptCloudApi
  getProjectOptions: CyPromptServerOptions['getProjectOptions']
  manifest: Record<string, string>
}

const debug = Debug('cypress:server:cy-prompt')

export class CyPromptManager implements CyPromptManagerShape {
  status: CyPromptStatus = 'NOT_INITIALIZED'
  private _cyPromptServer: CyPromptServerShape | undefined

  async setup ({ script, cyPromptPath, cyPromptHash, getProjectOptions, cloudApi, manifest }: SetupOptions): Promise<void> {
    const { createCyPromptServer } = requireScript<CyPromptServer>(script).default

    debug(`initializing cy-prompt`)

    try {
      this._cyPromptServer = await createCyPromptServer({
        cyPromptHash,
        cyPromptPath,
        cloudApi,
        getProjectOptions,
        manifest,
        verifyHash: (contents: BinaryLike, expectedHash: string) => {
          // If we are running locally, we don't need to verify the signature. This
          // environment variable will get stripped in the binary.
          if (process.env.CYPRESS_LOCAL_CY_PROMPT_PATH) {
            return true
          }

          const actualHash = crypto.createHash('sha256').update(contents).digest('hex')

          return actualHash === expectedHash
        },
      })

      this.status = 'INITIALIZED'
    } catch (e) {
      debug(`Failed initializing cy-prompt %o`, e)
      this.status = 'IN_ERROR'
    }
  }

  initializeRoutes (router: Router): void {
    if (this._cyPromptServer) {
      this.invokeSync('initializeRoutes', { isEssential: true }, router)
    }
  }

  addSocketListeners (addSocketListenerOptions: CyPromptAddSocketListenerOptions): void {
    if (this._cyPromptServer) {
      this.invokeSync('addSocketListeners', { isEssential: true }, addSocketListenerOptions)
    }
  }

  connectToBrowser (target: CyPromptCDPClient): void {
    if (this._cyPromptServer) {
      return this.invokeSync('connectToBrowser', { isEssential: true }, target)
    }
  }

  reset (testId?: string): void {
    if (this._cyPromptServer) {
      return this.invokeSync('reset', { isEssential: true }, testId)
    }
  }

  /**
   * Abstracts invoking a synchronous method on the CyPromptServer instance, so we can handle
   * errors in a uniform way
   */
  private invokeSync<K extends CyPromptServerSyncMethods> (method: K, { isEssential }: { isEssential: boolean }, ...args: Parameters<CyPromptServerShape[K]>): any | void {
    if (!this._cyPromptServer) {
      return
    }

    try {
      // @ts-expect-error - TS not associating the method & args properly, even though we know it's correct
      return this._cyPromptServer[method].apply(this._cyPromptServer, args)
    } catch (error: unknown) {
      let actualError: Error

      if (!(error instanceof Error)) {
        actualError = new Error(String(error))
      } else {
        actualError = error
      }

      if (isEssential) {
        this.status = 'IN_ERROR'
      }

      // TODO: report error
      debug('Error invoking cy prompt server method %s: %o', method, actualError)
    }
  }
  /**
   * Abstracts invoking an asynchronous method on the CyPromptServer instance, so we can handle
   * errors in a uniform way
   */
  private async invokeAsync <K extends CyPromptServerAsyncMethods> (method: K, { isEssential }: { isEssential: boolean }, ...args: Parameters<CyPromptServerShape[K]>): Promise<ReturnType<CyPromptServerShape[K]> | undefined> {
    if (!this._cyPromptServer) {
      return undefined
    }

    try {
      // @ts-expect-error - TS not associating the method & args properly, even though we know it's correct
      return await this._cyPromptServer[method].apply(this._cyPromptServer, args)
    } catch (error: unknown) {
      let actualError: Error

      if (!(error instanceof Error)) {
        actualError = new Error(String(error))
      } else {
        actualError = error
      }

      // only set error state if this request is essential
      if (isEssential) {
        this.status = 'IN_ERROR'
      }

      // TODO: report error
      debug('Error invoking cy prompt server method %s: %o', method, actualError)

      return undefined
    }
  }
}

// Helper types for invokeSync / invokeAsync
type CyPromptServerSyncMethods = {
  [K in keyof CyPromptServerShape]: ReturnType<CyPromptServerShape[K]> extends Promise<any> ? never : K
}[keyof CyPromptServerShape]

type CyPromptServerAsyncMethods = {
  [K in keyof CyPromptServerShape]: ReturnType<CyPromptServerShape[K]> extends Promise<any> ? K : never
}[keyof CyPromptServerShape]
