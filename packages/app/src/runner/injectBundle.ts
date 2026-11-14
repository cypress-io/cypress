export const dfd = Promise.withResolvers<void>()

// A load failure can reject this before the runner awaits it. The handler keeps
// that from being reported as unhandled; the runner still sees the rejection.
dfd.promise.catch(() => {})

export function injectBundle (namespace: string) {
  const src = `/${namespace}/runner/cypress_runner.js`

  const preload = document.createElement('link')

  preload.rel = 'preload'
  preload.as = 'script'
  preload.href = src

  const link = document.createElement('link')

  link.rel = 'stylesheet'
  link.href = `/${namespace}/runner/cypress_runner.css`

  document.head.appendChild(preload)
  document.head.appendChild(link)

  // Lazy so React stays out of the entry chunk, which is parsed before main.ts
  // starts running.
  import('./hostModules').then(({ publishHostModules }) => {
    publishHostModules()

    const script = document.createElement('script')

    script.src = src
    script.type = 'text/javascript'
    // The browser fires `load` even when the bundle throws while it evaluates,
    // so check for the global the bundle assigns last.
    script.onload = () => {
      if (window.UnifiedRunner) {
        dfd.resolve()
      } else {
        dfd.reject(new Error(`${src} loaded but did not define window.UnifiedRunner`))
      }
    }

    script.onerror = () => {
      dfd.reject(new Error(`Failed to load ${src}`))
    }

    document.head.appendChild(script)
  }).catch(dfd.reject)
}
