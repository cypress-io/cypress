import type { Span } from 'next/dist/telemetry/trace/trace'

// Starting with v11.1.1, a trace is required.
// 'next/dist/telemetry/trace/trace' only exists since v10.0.9
// and our peerDeps support back to v8 so try-catch this import
// Starting from 12.0 trace is now located in 'next/dist/trace/trace'
export async function getRunWebpackSpan (): Promise<{ runWebpackSpan?: Span }> {
  let trace: (name: string) => Span

  try {
    try {
      trace = await import('next/dist/telemetry/trace/trace').then((m) => m.trace)

      return { runWebpackSpan: trace('cypress') }
    } catch (_) {
      // @ts-ignore
      trace = await import('next/dist/trace/trace').then((m) => m.trace)

      return { runWebpackSpan: trace('cypress') }
    }
  } catch (_) {
    return {}
  }
}
