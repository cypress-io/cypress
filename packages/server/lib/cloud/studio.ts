import type { AppStudioShape, StudioErrorReport, StudioManagerShape, StudioStatus } from '@packages/types'
import type { Router } from 'express'
import Module from 'module'
import fetch from 'cross-fetch'
import pkg from '@packages/root'
import os from 'os'
import { agent } from '@packages/network'
import Debug from 'debug'

const debug = Debug('cypress:server:studio')
const routes = require('./routes')

const requireScript = (script: string) => {
  const mod = new Module('id', module)

  mod.filename = ''
  // _compile is a private method
  // @ts-expect-error
  mod._compile(script, mod.filename)

  module.children.splice(module.children.indexOf(mod), 1)

  return mod.exports
}

export class StudioManager implements StudioManagerShape {
  status: StudioStatus = 'NOT_INITIALIZED'
  private _appStudio: AppStudioShape | undefined
  private _studioHash: string | undefined

  static createInErrorManager (error: Error): StudioManager {
    const manager = new StudioManager()

    manager.status = 'IN_ERROR'

    manager.reportError(error).catch(() => { })

    return manager
  }

  async setup ({ script, studioPath, studioHash }: { script: string, studioPath: string, studioHash?: string }): Promise<void> {
    const { AppStudio } = requireScript(script)

    this._appStudio = new AppStudio({ studioPath })
    this._studioHash = studioHash
    this.status = 'INITIALIZED'
  }

  initializeRoutes (router: Router): void {
    if (this._appStudio) {
      this.invokeSync('initializeRoutes', { isEssential: true }, router)
    }
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
   * Abstracts invoking a synchronous method on the AppStudio instance, so we can handle
   * errors in a uniform way
   */
  private invokeSync<K extends AppStudioSyncMethods> (method: K, { isEssential }: { isEssential: boolean }, ...args: Parameters<AppStudioShape[K]>): any | void {
    if (!this._appStudio) {
      return
    }

    try {
      return this._appStudio[method].apply(this._appStudio, args)
    } catch (error) {
      this.status = 'IN_ERROR'
      // Call and forget this, we don't want to block the main thread
      this.reportError(error).catch(() => { })
    }
  }

  /**
   * Abstracts invoking a synchronous method on the AppStudio instance, so we can handle
   * errors in a uniform way
   */
  private async invokeAsync <K extends AppStudioAsyncMethods> (method: K, { isEssential }: { isEssential: boolean }, ...args: Parameters<AppStudioShape[K]>): Promise<ReturnType<AppStudioShape[K]> | undefined> {
    if (!this._appStudio) {
      return undefined
    }

    try {
      // @ts-expect-error - TS not associating the method & args properly, even though we know it's correct
      return await this._appStudio[method].apply(this._appStudio, args)
    } catch (error) {
      this.status = 'IN_ERROR'
      // Call and forget this, we don't want to block the main thread
      this.reportError(error).catch(() => { })

      // TODO: Figure out errors
      return undefined
    }
  }
}

// Helper types for invokeSync / invokeAsync
type AppStudioSyncMethods = {
  [K in keyof AppStudioShape]: ReturnType<AppStudioShape[K]> extends Promise<any> ? never : K
}[keyof AppStudioShape]

type AppStudioAsyncMethods = {
  [K in keyof AppStudioShape]: ReturnType<AppStudioShape[K]> extends Promise<any> ? K : never
}[keyof AppStudioShape]
