import type { StudioErrorReport, StudioManagerShape, StudioStatus, StudioServerDefaultShape, StudioServerShape, ProtocolManagerShape, StudioCloudApi } from '@packages/types'
import type { Router } from 'express'
import type { Socket } from 'socket.io'
import fetch from 'cross-fetch'
import pkg from '@packages/root'
import os from 'os'
import { agent } from '@packages/network'
import Debug from 'debug'
import { requireScript } from './require_script'
import type Database from 'better-sqlite3'

interface StudioServer { default: StudioServerDefaultShape }

interface SetupOptions {
  script: string
  studioPath: string
  studioHash?: string
  projectSlug?: string
  cloudApi: StudioCloudApi
}

const debug = Debug('cypress:server:studio')
const routes = require('./routes')

export class StudioManager implements StudioManagerShape {
  status: StudioStatus = 'NOT_INITIALIZED'
  isProtocolEnabled: boolean = false
  protocolManager: ProtocolManagerShape | undefined
  private _studioServer: StudioServerShape | undefined
  private _studioHash: string | undefined

  static createInErrorManager (error: Error): StudioManager {
    const manager = new StudioManager()

    manager.status = 'IN_ERROR'

    manager.reportError(error).catch(() => { })

    return manager
  }

  setProtocolDb (db: Database.Database): void {
    this.invokeSync('setProtocolDb', { isEssential: true }, db)
  }

  async setup ({ script, studioPath, studioHash, projectSlug, cloudApi }: SetupOptions): Promise<void> {
    const { createStudioServer } = requireScript<StudioServer>(script).default

    this._studioServer = await createStudioServer({
      studioPath,
      projectSlug,
      cloudApi,
    })

    this._studioHash = studioHash
    this.status = 'INITIALIZED'
  }

  initializeRoutes (router: Router): void {
    if (this._studioServer) {
      this.invokeSync('initializeRoutes', { isEssential: true }, router)
    }
  }

  addSocketListeners (socket: Socket): void {
    if (this._studioServer) {
      this.invokeSync('addSocketListeners', { isEssential: true }, socket)
    }
  }

  async canAccessStudioAI (browser: Cypress.Browser): Promise<boolean> {
    return (await this.invokeAsync('canAccessStudioAI', { isEssential: true }, browser)) ?? false
  }

  private async reportError (error: Error): Promise<void> {
    try {
      const payload: StudioErrorReport = {
        studioHash: this._studioHash,
        errors: [{
          name: error.name ?? `Unknown name`,
          stack: error.stack ?? `Unknown stack`,
          message: error.message ?? `Unknown message`,
        }],
      }

      const body = JSON.stringify(payload)

      await fetch(routes.apiRoutes.studioErrors() as string, {
        // @ts-expect-error - this is supported
        agent,
        method: 'POST',
        body,
        headers: {
          'Content-Type': 'application/json',
          'x-cypress-version': pkg.version,
          'x-os-name': os.platform(),
          'x-arch': os.arch(),
        },
      })
    } catch (e) {
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
      // Call and forget this, we don't want to block the main thread
      this.reportError(actualError).catch(() => { })
    }
  }

  /**
   * Abstracts invoking a synchronous method on the StudioServer instance, so we can handle
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

      this.status = 'IN_ERROR'
      // Call and forget this, we don't want to block the main thread
      this.reportError(actualError).catch(() => { })

      // TODO: Figure out errors
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
