// function injectReporterStyle () {
//   const style = document.createElement('style')

import { initializeStore } from '../store'

//   style.innerText = `
//     .reporter {
//       min-height: 0;
//       width: 300px;
//       left: 750px;
//       position: absolute;
//     }
//   `

//   document.head.appendChild(style)
// }

export async function injectBundle (ready: () => void) {
  const src = '/__cypress/runner/cypress_runner.js'

  const alreadyInjected = document.querySelector(`script[src="${src}"]`)

  if (alreadyInjected) {
    ready()

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

  // injectReporterStyle()

  script.onload = () => {
    // just stick config on window until we figure out how we are
    // going to manage it
    window.UnifiedRunner.config = window.UnifiedRunner.decodeBase64(data.base64Config)
    window.UnifiedRunner.MobX.runInAction(() => {
      initializeStore(window.UnifiedRunner.config.testingType)
    })

    ready()
  }
}
