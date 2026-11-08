import type { ProjectFixtureDir } from '@tooling/system-tests'
import type { OpenModeOptions } from '@packages/types'
import type { DocumentNode, ExecutionResult } from 'graphql'
import type sinon from 'sinon'
import type { Response } from 'cross-fetch'
import type nock from 'nock'

export interface WithCtxOptions extends Cypress.Loggable, Cypress.Timeoutable {
  retry?: boolean
  retryDelay?: number // default 1000
  retryCount?: number // default 5
  projectName?: ProjectFixtureDir
  [key: string]: any
}

export interface WithCtxInjected extends WithCtxOptions {
  require: typeof require
  process: typeof process
  sinon: typeof sinon
  testState: Record<string, any>
  projectDir(projectName: ProjectFixtureDir): string
}

interface RemoteGraphQLInterceptPayload {
  operationName?: string
  query: string
  variables: Record<string, any>
  document: DocumentNode
  result: ExecutionResult
  callCount: number
  Response: typeof Response
}

interface RemoteGraphQLBatchInterceptPayload<T> {
  key: string
  index: number
  field: string
  variables: Record<string, any>
  result: T
}

export type RemoteGraphQLInterceptor<T = { [key: string]: any }> = (
  obj: RemoteGraphQLInterceptPayload, testState: Record<string, any>, options: Record<string, any>) => ExecutionResult<T> | Promise<ExecutionResult<T>> | Response

export type RemoteGraphQLBatchInterceptor<T = any> = (obj: RemoteGraphQLBatchInterceptPayload<T>, testState: Record<string, any>) => T | Promise<T>

export interface MockNodeCloudRequestOptions {
  url: string
  method: string
  body: nock.Body
  persist?: boolean
}

export interface MockNodeCloudStreamingRequestOptions {
  url: string
  method: string
  body: nock.Body
}

export interface ResetOptionsResult {
  modeOptions: OpenModeOptions
  e2eServerPort?: number | null
}

export interface OpenGlobalModeOptions {
  argv?: string[]
  byFlag?: boolean
}

export type UnwrapPromise<R> = R extends PromiseLike<infer U> ? U : R

export type CyTaskResult<R> =
  { value?: never, error: { name: string, message: string, stack?: string } } |
  { value: UnwrapPromise<R>, error?: never }
