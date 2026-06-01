/**
 * Build a stack string that includes the error's `cause` chain. Crash reports
 * only forward an error's `name`/`message`/`stack`/`code`/`errno`, so a wrapped
 * error (e.g. BundleError) otherwise loses the underlying failure entirely — its
 * real stack, syscall, and the path that failed. We fold those into the stack so
 * they reach Sentry without any payload-schema change.
 *
 * The returned string still contains raw paths; callers are expected to run it
 * through `stripPath` before reporting (matching how `error.stack` is handled).
 */
export const stackWithCause = (error: Error): string => {
  const base = error.stack ?? error.message ?? 'Unknown stack'
  const cause = (error as Error & { cause?: unknown }).cause

  if (!cause || typeof cause !== 'object') {
    return base
  }

  const c = cause as {
    message?: unknown
    stack?: unknown
    code?: unknown
    errno?: unknown
    syscall?: unknown
    path?: unknown
    dest?: unknown
  }

  const lines: string[] = []

  if (typeof c.stack === 'string') {
    lines.push(c.stack)
  } else if (typeof c.message === 'string') {
    lines.push(c.message)
  }

  const meta = [
    c.code != null ? `code=${c.code}` : null,
    c.errno != null ? `errno=${c.errno}` : null,
    c.syscall != null ? `syscall=${c.syscall}` : null,
    c.path != null ? `path=${c.path}` : null,
    c.dest != null ? `dest=${c.dest}` : null,
  ].filter(Boolean).join(' ')

  if (meta) {
    lines.push(meta)
  }

  if (lines.length === 0) {
    return base
  }

  return `${base}\nCaused by: ${lines.join('\n')}`
}
