export const dfd = Promise.withResolvers<void>()

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

  // The runner bundle reads React and MobX from the host modules, so they must
  // be published before it executes. Importing them lazily keeps React out of
  // the entry chunk, so it is parsed alongside the runner rather than before
  // the app mounts.
  import('./hostModules').then(({ publishHostModules }) => {
    publishHostModules()

    const script = document.createElement('script')

    script.src = src
    script.type = 'text/javascript'
    script.onload = () => {
      dfd.resolve()
    }

    document.head.appendChild(script)
  }).catch(dfd.reject)
}
