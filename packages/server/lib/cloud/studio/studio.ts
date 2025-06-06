import type { StudioManagerShape, StudioStatus, StudioServerDefaultShape, StudioServerShape, ProtocolManagerShape, StudioCloudApi, StudioAIInitializeOptions, StudioEvent } from '@packages/types'
import type { Router } from 'express'
import type { Socket } from 'socket.io'
import Debug from 'debug'
import { requireScript } from '../require_script'
import path from 'path'
import { reportStudioError, ReportStudioErrorOptions } from '../api/studio/report_studio_error'

interface StudioServer { default: StudioServerDefaultShape }

interface SetupOptions {
  script: string
  studioPath: string
  studioHash?: string
  projectSlug?: string
  cloudApi: StudioCloudApi
  shouldEnableStudio: boolean
}

const debug = Debug('cypress:server:studio')

export class StudioManager implements StudioManagerShape {
  status: StudioStatus = 'NOT_INITIALIZED'
  protocolManager: ProtocolManagerShape | undefined
  private _studioServer: StudioServerShape | undefined

  static createInErrorManager ({ cloudApi, studioHash, projectSlug, error, studioMethod, studioMethodArgs }: ReportStudioErrorOptions): StudioManager {
    const manager = new StudioManager()

    manager.status = 'IN_ERROR'

    reportStudioError({
      cloudApi,
      studioHash,
      projectSlug,
      error,
      studioMethod,
      studioMethodArgs,
    })

    return manager
  }

  async setup ({ script, studioPath, studioHash, projectSlug, cloudApi, shouldEnableStudio }: SetupOptions): Promise<void> {
    const { createStudioServer } = requireScript<StudioServer>(script).default

    this._studioServer = await createStudioServer({
      studioHash,
      studioPath,
      projectSlug,
      cloudApi,
      betterSqlite3Path: path.dirname(require.resolve('better-sqlite3/package.json')),
    })

    this.status = shouldEnableStudio ? 'ENABLED' : 'INITIALIZED'
  }

  initializeRoutes (router: Router): void {
    if (this._studioServer) {
      this.invokeSync('initializeRoutes', { isEssential: true }, router)
    }
  }

  async captureStudioEvent (event: StudioEvent): Promise<void> {
    if (this._studioServer) {
      // this request is not essential - we don't want studio to error out if a telemetry request fails
      return (await this.invokeAsync('captureStudioEvent', { isEssential: false }, event))
    }

    return Promise.resolve()
  }

  addSocketListeners (socket: Socket): void {
    if (this._studioServer) {
      this.invokeSync('addSocketListeners', { isEssential: true }, socket)
    }
  }

  async canAccessStudioAI (browser: Cypress.Browser): Promise<boolean> {
    return (await this.invokeAsync('canAccessStudioAI', { isEssential: true }, browser)) ?? false
  }

  async initializeStudioAI (options: StudioAIInitializeOptions): Promise<void> {
    await this.invokeAsync('initializeStudioAI', { isEssential: true }, options)
  }

  async destroy (): Promise<void> {
    await this.invokeAsync('destroy', { isEssential: true })
  }

  reportError (error: unknown, studioMethod: string, ...studioMethodArgs: unknown[]): void {
    try {
      this._studioServer?.reportError(error, studioMethod, ...studioMethodArgs)
    } catch (e) {
      // If we fail to report the error, we shouldn't try and report it again
      debug(`Error calling StudioManager.reportError: %o, original error %o`, e, error)
    }
  }

  /**
   * Abstracts invoking a synchronous method on the StudioServer instance, so we can handle
   * errors in a uniform way
   */
  private invokeSync<K extends StudioServerSyncMethods> (method: K, { isEssential }: { isEssential: boolean }, ...args: Parameters<StudioServerShape[K]>): any | void {
    if (!this._studioServer) {
      return
    }

    try {
      // @ts-expect-error - TS not associating the method & args properly, even though we know it's correct
      return this._studioServer[method].apply(this._studioServer, args)
    } catch (error: unknown) {
      let actualError: Error

      if (!(error instanceof Error)) {
        actualError = new Error(String(error))
      } else {
        actualError = error
      }

      this.status = 'IN_ERROR'
      this.reportError(actualError, method, ...args)
    }
  }

  get isProtocolEnabled () {
    return !!this.protocolManager
  }

  /**
   * Abstracts invoking an asynchronous method on the StudioServer instance, so we can handle
   * errors in a uniform way
   */
  private async invokeAsync <K extends StudioServerAsyncMethods> (method: K, { isEssential }: { isEssential: boolean }, ...args: Parameters<StudioServerShape[K]>): Promise<ReturnType<StudioServerShape[K]> | undefined> {
    if (!this._studioServer) {
      return undefined
    }

    try {
      // @ts-expect-error - TS not associating the method & args properly, even though we know it's correct
      return await this._studioServer[method].apply(this._studioServer, args)
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

      this.reportError(actualError, method, ...args)

      return undefined
    }
  }
}

// Helper types for invokeSync / invokeAsync
type StudioServerSyncMethods = {
  [K in keyof StudioServerShape]: ReturnType<StudioServerShape[K]> extends Promise<any> ? never : K
}[keyof StudioServerShape]

type StudioServerAsyncMethods = {
  [K in keyof StudioServerShape]: ReturnType<StudioServerShape[K]> extends Promise<any> ? K : never
}[keyof StudioServerShape]
