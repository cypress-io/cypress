/// <reference types="cypress" />

import type { Router } from 'express'
import type { AxiosInstance } from 'axios'
import type Database from 'better-sqlite3'

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
  studioPath: string
  projectSlug?: string
  cloudApi: StudioCloudApi
}

export interface StudioServerShape {
  initializeRoutes(router: Router): void
  canAccessStudioAI(browser: Cypress.Browser): Promise<boolean>
  setProtocolDb(database: Database.Database): void
}

export interface StudioServerDefaultShape {
  createStudioServer: (
    options: StudioServerOptions
  ) => Promise<StudioServerShape>
  MOUNT_VERSION: number
}
