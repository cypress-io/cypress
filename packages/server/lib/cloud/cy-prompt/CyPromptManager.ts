import type { CyPromptManagerShape, CyPromptStatus, CyPromptServerDefaultShape, CyPromptServerShape, CyPromptCloudApi, CyPromptCDPClient } from '@packages/types'
import type { Router } from 'express'
import Debug from 'debug'
import { requireScript } from '../require_script'

interface CyPromptServer { default: CyPromptServerDefaultShape }

interface SetupOptions {
  script: string
  cyPromptPath: string
  cyPromptHash?: string
  projectSlug?: string
  cloudApi: CyPromptCloudApi
}

const debug = Debug('cypress:server:cy-prompt')

export class CyPromptManager implements CyPromptManagerShape {
  status: CyPromptStatus = 'NOT_INITIALIZED'
  private _cyPromptServer: CyPromptServerShape | undefined

  async setup ({ script, cyPromptPath, cyPromptHash, projectSlug, cloudApi }: SetupOptions): Promise<void> {
    const { createCyPromptServer } = requireScript<CyPromptServer>(script).default

    this._cyPromptServer = await createCyPromptServer({
      cyPromptHash,
      cyPromptPath,
      projectSlug,
      cloudApi,
    })

    this.status = 'INITIALIZED'
  }

  initializeRoutes (router: Router): void {
    if (this._cyPromptServer) {
      this.invokeSync('initializeRoutes', { isEssential: true }, router)
    }
  }

  async handleBackendRequest (eventName: string, ...args: any[]): Promise<any> {
    if (this._cyPromptServer) {
      return this.invokeAsync('handleBackendRequest', { isEssential: false }, eventName, ...args)
    }
  }

  connectToBrowser (target: CyPromptCDPClient): void {
    if (this._cyPromptServer) {
      return this.invokeSync('connectToBrowser', { isEssential: true }, target)
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
