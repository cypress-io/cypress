import { setCtx } from '@packages/data-context'
import type { DataContext } from '@packages/data-context'
import type { Span } from '@opentelemetry/api'

import { makeDataContext } from '../makeDataContext'

export function setupCtx (mode: string, options: any, telemetry: Span): DataContext {
  const ctx = setCtx(makeDataContext({ mode: mode === 'run' ? mode : 'open', modeOptions: options }))

  ctx.initializeMode().then(() => {
    telemetry?.end()
  })

  return ctx
}
