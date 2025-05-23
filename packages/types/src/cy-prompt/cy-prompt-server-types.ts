// Note: This file is owned by the cloud delivered
// cy prompt bundle. It is downloaded and copied here.
// It should not be modified directly here.

/// <reference types="cypress" />

import type { Router } from 'express'
import type { AxiosInstance } from 'axios'

interface RetryOptions {
  maxAttempts: number
  retryDelay?: (attempt: number) => number
  shouldRetry?: (err?: unknown) => boolean
  onRetry?: (delay: number, err: unknown) => void
}

export interface CyPromptCloudApi {
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

export interface CyPromptServerOptions {
  cyPromptHash?: string
  cyPromptPath: string
  projectSlug?: string
  cloudApi: CyPromptCloudApi
}

export interface CyPromptServerShape {
  initializeRoutes(router: Router): void
  handleBackendRequest: (eventName: string, ...args: any[]) => Promise<any>
}

export interface CyPromptServerDefaultShape {
  createCyPromptServer: (
    options: CyPromptServerOptions
  ) => Promise<CyPromptServerShape>
  MOUNT_VERSION: number
}
