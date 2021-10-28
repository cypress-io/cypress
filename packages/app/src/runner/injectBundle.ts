import { initializeMobxStore, useAutStore } from '../store'

export async function injectBundle () {
  const src = '/__cypress/runner/cypress_runner.js'

  const alreadyInjected = document.querySelector(`script[src="${src}"]`)

  if (alreadyInjected) {
    return
  }

  const response = await window.fetch('/api')
  const data = await response.json()
  const script = document.createElement('script')

  script.src = src
  script.type = 'text/javascript'

  const link = document.createElement('link')

  link.rel = 'stylesheet'
  link.href = '/__cypress/runner/cypress_runner.css'

  document.head.appendChild(script)
  document.head.appendChild(link)

  return new Promise<void>((resolve) => {
    script.onload = () => {
      // just stick config on window until we figure out how we are
      // going to manage it
      const config = window.UnifiedRunner.decodeBase64(data.base64Config) as any
      const autStore = useAutStore()

      autStore.updateDimensions(config.viewportWidth, config.viewportHeight)

      window.UnifiedRunner.config = config

      window.UnifiedRunner.MobX.runInAction(() => {
        const store = initializeMobxStore(window.UnifiedRunner.config.testingType)

        // TODO(lachlan): use GraphQL to get and set the configuration once
        // it is more practical to do so
        // find out if we need to continue managing viewportWidth/viewportHeight in MobX at all.
        store.updateDimensions(config.viewportWidth, config.viewportHeight)
      })

      resolve()
    }
  })
}
