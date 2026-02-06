// Note: This file is owned by the cloud delivered
// `studio` bundle. It is downloaded and copied to the app.
// It should not be modified directly in the app.

/// <reference types="cypress" />

import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping.d'
import type { Router } from 'express'
import type { AxiosInstance } from 'axios'
import type { Socket } from 'socket.io'
import type { BinaryLike } from 'crypto'

export const StudioMetricsTypes = {
  STUDIO_STARTED: 'studio:started',
  STUDIO_PANEL_OPENED: 'studio:panel:opened',
  STUDIO_RECORDING_RESUMED: 'studio:recording:resumed',
  STUDIO_RECORDING_PAUSED: 'studio:recording:paused',
  STUDIO_INTERACTION_RECORDED: 'studio:interaction:recorded',
  STUDIO_ASSERTION_RECORDED: 'studio:assertion:recorded',
  STUDIO_EDITOR_SAVED: 'studio:editor:saved',
  STUDIO_RECOMMENDATION_EXPANDED: 'studio:recommendation:expanded',
} as const

export type StudioMetricsType =
  (typeof StudioMetricsTypes)[keyof typeof StudioMetricsTypes]

export interface StudioEvent {
  type: StudioMetricsType
  machineId: string
  projectId?: string
  studioSessionId?: string
  browser?: {
    name: string
    family: string
    channel?: string
    version?: string
  }
  cypressVersion?: string
  generationId?: string
}

interface RetryOptions {
  maxAttempts: number
  retryDelay?: (attempt: number) => number
  shouldRetry?: (err?: unknown) => boolean
  onRetry?: (delay: number, err: unknown) => void
}

export interface StudioCloudApi {
  cloudUrl: string
  cloudHeaders: Record<string, string>
  CloudRequest: AxiosInstance
  isRetryableError: (err: unknown) => boolean
  asyncRetry: AsyncRetry
}

type AsyncRetry = <TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: RetryOptions
) => (...args: TArgs) => Promise<TResult>

export type BrowserWindow = {
  webContents: {
    loadURL: (url: string) => Promise<void>
    executeJavaScript: (script: string) => Promise<any>
  }
  setSize: (width: number, height: number) => void
  destroy: () => void
  isDestroyed: () => boolean
  show: () => void
}

export type StudioElectronApi = {
  createBrowserWindow: () => BrowserWindow
}

export interface StudioAuthenticatedUserShape {
  id?: string // Cloud user id
  name?: string
  email?: string
  authToken?: string
}

export interface StudioProjectOptions {
  user?: StudioAuthenticatedUserShape
  projectSlug?: string
}

export interface StudioServerOptions {
  studioHash?: string
  studioPath: string
  getProjectOptions?: () => Promise<StudioProjectOptions>
  /**
   * @deprecated use getProjectOptions instead
   */
  projectSlug?: string
  cloudApi: StudioCloudApi
  betterSqlite3Path: string
  sessionId?: string
  manifest?: Record<string, string>
  verifyHash: (contents: BinaryLike, expectedHash: string) => boolean
  studioElectron?: StudioElectronApi
}

export interface StudioAIInitializeOptions {
  protocolDbPath: string
  studioElectron?: StudioElectronApi
}

export interface StudioAddSocketListenersOptions {
  socket: Socket
  onBeforeSave: () => void
  onAfterSave: (options: { error?: Error }) => void
}

export type StudioCDPCommands = ProtocolMapping.Commands

export type StudioCDPCommand<T extends keyof StudioCDPCommands> =
  StudioCDPCommands[T]

export type StudioCDPEvents = ProtocolMapping.Events

export type StudioCDPEvent<T extends keyof StudioCDPEvents> = StudioCDPEvents[T]

export interface StudioCDPClient {
  send<T extends Extract<keyof StudioCDPCommands, string>>(
    command: T,
    params?: StudioCDPCommand<T>['paramsType'][0]
  ): Promise<StudioCDPCommand<T>['returnType']>
  on<T extends Extract<keyof StudioCDPEvents, string>>(
    eventName: T,
    cb: (event: StudioCDPEvent<T>[0]) => void | Promise<unknown>
  ): void
  off<T extends Extract<keyof StudioCDPEvents, string>>(
    eventName: T,
    cb: (event: StudioCDPEvent<T>[0]) => void | Promise<unknown>
  ): void
}

export interface StudioServerShape {
  initializeRoutes(router: Router): void
  canAccessStudioAI(browser: Cypress.Browser): Promise<boolean>
  addSocketListeners(options: StudioAddSocketListenersOptions | Socket): void
  initializeStudioAI(options: StudioAIInitializeOptions): Promise<void>
  connectToBrowser(cdpClient: StudioCDPClient): void
  updateSessionId(sessionId: string): void
  reportError(
    error: unknown,
    studioMethod: string,
    ...studioMethodArgs: unknown[]
  ): void
  destroy(): Promise<void>
  captureStudioEvent(event: StudioEvent): Promise<void>
}

export interface StudioServerDefaultShape {
  createStudioServer: (
    options: StudioServerOptions
  ) => Promise<StudioServerShape>
  MOUNT_VERSION: number
}
