export type DevServerCompileSuccessData = {
  specFile?: string
  jitRecompile?: boolean
}

export type DevServerSpecUpdateEvents = {
  once (event: 'dev-server:on-spec-updated' | 'dev-server:specs:unchanged', handler: () => void): void
  on (event: 'dev-server:compile:success', handler: (data?: DevServerCompileSuccessData) => void): void
  off (event: 'dev-server:compile:success', handler: (data?: DevServerCompileSuccessData) => void): void
  off (event: 'dev-server:specs:unchanged', handler: () => void): void
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

    let resolved = false

    const cleanup = () => {
      events.off('dev-server:compile:success', onCompileSuccess)
      events.off('dev-server:specs:unchanged', onSpecsUnchanged)
    }

    const tryResolve = () => {
      if (resolved) {
        return
      }

      resolved = true
      cleanup()
      resolve()
    }

    const onCompileSuccess = ({ specFile, jitRecompile }: DevServerCompileSuccessData = {}) => {
      if (specFile && specFile !== spec.absolute) {
        return
      }

      // Webpack emits compile success for every build. Ignore in-flight compiles
      // that started before this spec update unless they include a matching spec file.
      if (!specFile && !jitRecompile) {
        return
      }

      tryResolve()
    }

    const onSpecsUnchanged = () => {
      tryResolve()
    }

    events.once('dev-server:specs:unchanged', onSpecsUnchanged)

    events.once('dev-server:on-spec-updated', () => {
      if (resolved) {
        return
      }

      events.on('dev-server:compile:success', onCompileSuccess)
    })

    events.emit('dev-server:on-spec-update', spec)
  })
}
