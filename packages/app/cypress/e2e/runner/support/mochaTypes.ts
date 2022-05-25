export type Timing = {
  hookId: `h${number}`
  fnDuration: number
  afterFnDuration: number
}

export type SanitizedTiming = {
  hookId?: `h${number}`
  fnDuration: 'match.number'
  afterFnDuration: 'match.number'
}

export type MochaLifecycleBase<T> = {
  'test'?: T
  'before each'?: T[]
  'after each'?: T[]
  'before all'?: T[]
  'after all'?: T[]
}

export type MochaLifecycleData = MochaLifecycleBase<Timing> & { lifecycle: number }

export type SanitizedMochaLifecycleData = MochaLifecycleBase<SanitizedTiming> & { lifecycle: string }
