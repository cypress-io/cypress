import { telemetry } from '@packages/telemetry'
import type { Span } from '@opentelemetry/api'

export function setupTelemetry (mode: string): Span {
  const span = telemetry.startSpan({ name: `initialize:mode:${mode}` })

  telemetry.getSpan('cypress')?.setAttribute('name', `cypress:${mode}`)

  return span
}
