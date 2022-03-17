// Base export types

export type SanitizedInvocationDetails = `{Object ${number}}`

export type Timing = {
  hookId: `h${number}`
  fnDuration: number
  afterFnDuration: number
}

export type SanitizedTiming = {
  hookId: `h${number}`
  fnDuration: "match.number",
  afterFnDuration: "match.number"
}

export type MochaLifecycleData = {
  lifecycle: number
  'before each': Timing[]
  'after each': Timing[]
  'before all': Timing[]
  'after all': Timing[]
}

export type SanitizedMochaLifecycleData = {
  lifecycle: 'match.number'
  'before each'?: SanitizedTiming[]
  'after each'?: SanitizedTiming[]
  'before all'?: SanitizedTiming[]
  'after all'?: SanitizedTiming[]
}

interface MochaSuite {
  id: `r${number}`
  title: string
  root: boolean,
  type: "suite",
  invocationDetails?: SanitizedInvocationDetails
  file: string | null
  retries: number
  _slow: number
}

interface MochaHook <Body extends string, InvocationDetails = string | Record<string, any>> {
  id: `r${number}`
  title: string
  hookName: string
  hookId: `h${number}`
  body: Body
  type: "hook",
  file: null,
  invocationDetails: InvocationDetails
  currentRetry: number,
  retries: number,
  _slow: number
}

export const snapshotKeys = new Set([
  '_testConfig',
  'id',
  'title',
  'root',
  'type',
  'file',
  'retries',
  '_slow',
  'invocationDetails',
  'body?',
  'hookId?',
  'hookName',
  'currentRetry',
  'order',
  'state',
  'duration',
  'wallClockStartedAt',
  'wallClockDuration',
  'timings',
  'final',
])

interface MochaTest<
  State extends 'passed' | 'failed',
  Body extends string,
  Duration extends number | 'match.number',
  WallClockStartedAt extends number | 'match.number',
> {
  _testConfig?: {
    testConfigList: []
    unverifiedTestConfig: {}
  }
  id: `r${number}`
  title: string
  root: boolean
  type: 'test'
  file: string | null
  retries: number
  _slow: number
  invocationDetails: SanitizedInvocationDetails
  body?: Body
  hookId?: `h${number}`
  hookName: string
  currentRetry?: number
  order: 1,
  state?: State
  duration: Duration
  wallClockStartedAt: WallClockStartedAt
  timings: {
    lifecycle: "match.number",
    test: {
      fnDuration: "match.number",
      afterFnDuration: "match.number"
    },
    'before each': Timing[]
    'after each': Timing[]
    'before all': Timing[]
    'after all': Timing[]
  },
  final: true,
}

export type SanitizedFail = {
  message: "[error message]",
  name: "AssertionError",
  stack: "match.string",
  sourceMappedStack: "match.string",
  parsedStack: "match.array"
}

export type MochaTestFail<
  Message extends string,
  Stack extends string,
  SourceMappedStack extends string,
  ParsedStack extends (string | any[])
> = {
  err: SanitizedFail
  failedFromHookId: `h${number}`,
}

// Start/End events
export type MochaStartSanitized = {
  start: 'match.date'
}

// Start/End events
export type MochaEndSanitized = {
  end: 'match.date'
}

// Runner end
export type MochaRunnerFailSanitizied = {

}

// Hook export type
export type MochaHookSanitized = MochaHook<'[body]',  SanitizedInvocationDetails>
export type MochaHookUnsanitized = MochaHook<string,  Record<string, any>>

// Suite export type
export type MochaSuiteSantizied = MochaSuite
export type MochaSuiteUnsantizied = MochaSuite

// Test export type (fail)
export type MochaTestFailSanitized = 
  MochaTest<'failed', '[body]', 'match.number', 'match.number'> &
  MochaTestFail<
    '[error message]',
    'match.string',
    'match.string',
    'match.array'
  >

export type MochaTestFailUnsanitized = 
  MochaTest<'failed', string, number, number> &
  MochaTestFail<
    string,
    string,
    string,
    any[]
  >

// Test export type (pass)
export type MochaTestPassSanitized = MochaTest<
  'passed',
  '[body]',
  'match.number',
  'match.number'
>

export type MochaTestPassUnsanitized = MochaTest<
  'passed',
  string,
  number,
  number
>

export type MochaInternalUnsanitized = 
  MochaHookUnsanitized |
  MochaSuiteUnsantizied |
  MochaTestFailUnsanitized |
  MochaTestPassUnsanitized

export type MochaInternalSanitized = 
  MochaHookSanitized |
  MochaSuiteSantizied |
  MochaTestFailSanitized |
  MochaTestPassSanitized |
  MochaStartSanitized |
  MochaEndSanitized | 
  MochaRunnerFailSanitizied