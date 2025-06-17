// Note: This file is owned by the cloud delivered
// cy prompt bundle. It is downloaded and copied here.
// It should not be modified directly here.

/// <reference types="cypress" />

import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping.d'
import type { Router } from 'express'
import type { AxiosInstance } from 'axios'
import type { Socket } from 'socket.io'

export type CyPromptCommands = ProtocolMapping.Commands

export type CyPromptCommand<T extends keyof CyPromptCommands> =
  CyPromptCommands[T]

export type CyPromptEvents = ProtocolMapping.Events

export type CyPromptEvent<T extends keyof CyPromptEvents> = CyPromptEvents[T]

interface RetryOptions {
  maxAttempts: number
  retryDelay?: (attempt: number) => number
  shouldRetry?: (err?: unknown) => boolean
  onRetry?: (delay: number, err: unknown) => void
}

export interface CyPromptCloudApi {
  cloudUrl: string
  CloudRequest: AxiosInstance
  isRetryableError: (err: unknown) => boolean
  asyncRetry: AsyncRetry
}

type AsyncRetry = <TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: RetryOptions
) => (...args: TArgs) => Promise<TResult>

export interface CyPromptAuthenticatedUserShape {
  id?: string //Cloud user id
  name?: string
  email?: string
  authToken?: string
}

export interface CyPromptProjectOptions {
  user?: CyPromptAuthenticatedUserShape
  projectSlug?: string
  record?: boolean
  key?: string
  isOpenMode?: boolean
}

export interface CyPromptServerOptions {
  cyPromptHash?: string
  cyPromptPath: string
  projectSlug?: string
  cloudApi: CyPromptCloudApi
  getProjectOptions: () => Promise<CyPromptProjectOptions>
}

export interface CyPromptCDPClient {
  send<T extends Extract<keyof CyPromptCommands, string>>(
    command: T,
    params?: CyPromptCommand<T>['paramsType'][0]
  ): Promise<CyPromptCommand<T>['returnType']>
  on<T extends Extract<keyof CyPromptEvents, string>>(
    eventName: T,
    cb: (event: CyPromptEvent<T>[0]) => void | Promise<unknown>
  ): void
}

export interface CyPromptServerShape {
  initializeRoutes(router: Router): void
  addSocketListeners(socket: Socket): void
  connectToBrowser: (cdpClient: CyPromptCDPClient) => void
  reset: (testId?: string) => void
}

export interface CyPromptServerDefaultShape {
  createCyPromptServer: (
    options: CyPromptServerOptions
  ) => Promise<CyPromptServerShape>
  MOUNT_VERSION: number
}
