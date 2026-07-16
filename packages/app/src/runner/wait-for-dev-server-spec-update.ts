export type DevServerCompileSuccessData = {
  specFile?: string
  jitRecompile?: boolean
  jitRecompileGeneration?: number
}

export type DevServerSpecUpdateEvents = {
  once (event: 'dev-server:on-spec-updated' | 'dev-server:specs:unchanged', handler: () => void): void
  once (event: 'dev-server:jit-recompile:queued', handler: (data: { generation: number }) => void): void
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
  const bundler = options.bundler

  if (bundler === 'vite') {
    return new Promise<void>((resolve) => {
      events.once('dev-server:on-spec-updated', () => resolve())
      events.emit('dev-server:on-spec-update', spec)
    })
  }

  const shouldWaitForWebpackCompile = bundler === 'webpack' || bundler === undefined

  return new Promise<void>((resolve) => {
    if (!shouldWaitForWebpackCompile) {
      events.once('dev-server:on-spec-updated', () => resolve())
      events.emit('dev-server:on-spec-update', spec)

      return
    }

    let resolved = false
    let webpackWaitActive = bundler === 'webpack'
    let expectedJitRecompileGeneration: number | undefined

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

    const onCompileSuccess = ({ specFile, jitRecompile, jitRecompileGeneration }: DevServerCompileSuccessData = {}) => {
      if (jitRecompile) {
        if (expectedJitRecompileGeneration !== undefined && jitRecompileGeneration === expectedJitRecompileGeneration) {
          tryResolve()
        }

        return
      }

      if (expectedJitRecompileGeneration !== undefined) {
        return
      }

      if (specFile && specFile !== spec.absolute) {
        return
      }

      // Webpack emits compile success for every build. Ignore in-flight compiles
      // that started before this spec update unless they include a matching spec file.
      if (!specFile) {
        return
      }

      tryResolve()
    }

    const onSpecsUnchanged = () => {
      if (expectedJitRecompileGeneration !== undefined) {
        return
      }

      webpackWaitActive = true
      tryResolve()
    }

    const onJitRecompileQueued = ({ generation }: { generation: number }) => {
      if (resolved) {
        return
      }

      webpackWaitActive = true
      expectedJitRecompileGeneration = generation
      events.on('dev-server:compile:success', onCompileSuccess)
    }

    const onSpecUpdated = () => {
      if (webpackWaitActive) {
        return
      }

      // When bundler is unknown, defer resolving on spec-updated so webpack JIT
      // events forwarded over IPC can arrive after the server ack.
      if (bundler === undefined) {
        setImmediate(() => {
          setImmediate(() => {
            if (!webpackWaitActive) {
              tryResolve()
            }
          })
        })

        return
      }

      tryResolve()
    }

    events.once('dev-server:specs:unchanged', onSpecsUnchanged)
    events.once('dev-server:jit-recompile:queued', onJitRecompileQueued)
    events.once('dev-server:on-spec-updated', onSpecUpdated)

    events.emit('dev-server:on-spec-update', spec)
  })
}
