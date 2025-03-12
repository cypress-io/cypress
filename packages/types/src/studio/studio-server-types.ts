import type { Router } from 'express'
import type { AxiosInstance } from 'axios'

interface RetryOptions {
  maxAttempts: number
  retryDelay?: (attempt: number) => number
  shouldRetry?: (err?: unknown) => boolean
  onRetry?: (delay: number, err: unknown) => void
}

export interface StudioBrowser {
  name: 'electron' | 'chrome' | 'chromium' | 'firefox' | 'edge' | string
  channel: 'stable' | 'canary' | 'beta' | 'dev' | 'nightly' | string
  family: 'chromium' | 'firefox' | 'webkit'
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
  canAccessStudioLLM(browser: StudioBrowser): Promise<boolean>
}

export interface StudioServerDefaultShape {
  createStudioServer: (
    options: StudioServerOptions
  ) => Promise<StudioServerShape>
  MOUNT_VERSION: number
}
