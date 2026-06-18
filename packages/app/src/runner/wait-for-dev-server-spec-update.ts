export type DevServerSpecUpdateEvents = {
  once (event: 'dev-server:on-spec-updated', handler: () => void): void
  on (event: 'dev-server:compile:success', handler: (data?: { specFile?: string }) => void): void
  off (event: 'dev-server:compile:success', handler: (data?: { specFile?: string }) => void): void
  emit (event: 'dev-server:on-spec-update', spec: { absolute: string }): void
}

/**
 * Notifies the dev server that a spec should be compiled, then waits until it is
 * safe to load that spec in the AUT.
 *
 * For webpack component testing with just-in-time compile, the server acknowledges
 * the spec update before webpack finishes recompiling. Resolving too early can load
 * a stale bundle (for example, one that still references a deleted spec file).
 */
export function waitForDevServerSpecUpdate (
  spec: { absolute: string },
  events: DevServerSpecUpdateEvents,
  options: { bundler?: string } = {},
): Promise<void> {
  const shouldWaitForWebpackCompile = options.bundler === 'webpack'

  return new Promise<void>((resolve) => {
    if (!shouldWaitForWebpackCompile) {
      events.once('dev-server:on-spec-updated', () => resolve())
      events.emit('dev-server:on-spec-update', spec)

      return
    }

    const onCompileSuccess = ({ specFile }: { specFile?: string } = {}) => {
      if (specFile && specFile !== spec.absolute) {
        return
      }

      events.off('dev-server:compile:success', onCompileSuccess)
      resolve()
    }

    events.once('dev-server:on-spec-updated', () => {
      events.on('dev-server:compile:success', onCompileSuccess)
    })

    events.emit('dev-server:on-spec-update', spec)
  })
}
