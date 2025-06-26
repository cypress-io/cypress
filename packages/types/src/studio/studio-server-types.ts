/// <reference types="cypress" />

import type { Router } from 'express'
import type { AxiosInstance } from 'axios'
import type { Socket } from 'socket.io'
import type { BinaryLike } from 'crypto'

export const StudioMetricsTypes = {
  STUDIO_STARTED: 'studio:started',
} as const

export type StudioMetricsType =
  (typeof StudioMetricsTypes)[keyof typeof StudioMetricsTypes]

export interface StudioEvent {
  type: StudioMetricsType
  machineId: string | null
  projectId?: string
  browser?: {
    name: string
    family: string
    channel?: string
    version?: string
  }
  cypressVersion?: string
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

export interface StudioServerOptions {
  studioHash?: string
  studioPath: string
  projectSlug?: string
  cloudApi: StudioCloudApi
  betterSqlite3Path: string
  manifest: Record<string, string>
  verifyHash: (contents: BinaryLike, expectedHash: string) => boolean
}

export interface StudioAIInitializeOptions {
  protocolDbPath: string
}

export interface StudioServerShape {
  initializeRoutes(router: Router): void
  canAccessStudioAI(browser: Cypress.Browser): Promise<boolean>
  addSocketListeners(socket: Socket): void
  initializeStudioAI(options: StudioAIInitializeOptions): Promise<void>
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
