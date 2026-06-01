import type { EventEmitter } from 'events'
import type { ProcessIpcWrapper } from '@packages/types'

export type PluginChildIpc = ProcessIpcWrapper

export interface PluginInvokeIds {
  eventId: number
  invocationId: string
}

type PluginEventHandler = (...args: any[]) => any

export type TaskEventHandler = Record<string, PluginEventHandler>

export type RegisteredPluginHandler = PluginEventHandler | TaskEventHandler

export interface RegisteredPluginEvent {
  event: string
  handler: RegisteredPluginHandler
}

export interface PluginRegistration {
  event: string
  eventId: number
}

type RegisterChildEventFn = (event: string, handler: RegisteredPluginHandler) => void

export type SetupNodeEventsFn = (
  on: RegisterChildEventFn,
  config: Cypress.PluginConfigOptions,
) => Cypress.PluginConfigOptions | void | Promise<Cypress.PluginConfigOptions | void>

export type PluginExecuteEvent =
  | 'dev-server:start'
  | 'file:preprocessor'
  | 'before:run'
  | 'before:spec'
  | 'after:run'
  | 'after:spec'
  | 'after:screenshot'
  | '_process:cross:origin:callback'
  | 'task'
  | '_get:task:keys'
  | '_get:task:body'
  | 'before:browser:launch'
  | 'after:browser:launch'

interface ValidateEventSuccess {
  isValid: true
}

interface ValidateEventFailure {
  isValid: false
  error: Error
  userEvents?: string[]
}

export type ValidateEventResult = ValidateEventSuccess | ValidateEventFailure

export interface CrossOriginCallbackArgs {
  file: string
  fn: string
  projectRoot: string
}

interface PreprocessorFileArgs {
  filePath: string
  outputPath: string
  shouldWatch: boolean
}

export interface PreprocessorFileObject extends EventEmitter, PreprocessorFileArgs {}

interface ConfigFileTestingTypeBlock {
  setupNodeEvents?: SetupNodeEventsFn | unknown
  devServer?: unknown
  devServerConfig?: unknown
}

export interface ConfigFileExport {
  component?: ConfigFileTestingTypeBlock
  e2e?: ConfigFileTestingTypeBlock
  [key: string]: unknown
}

export interface DevServerInfo {
  devServer: (...args: any[]) => any
  objApi: boolean
}
