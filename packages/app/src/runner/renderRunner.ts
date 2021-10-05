import type { UnifiedRunner } from '../runner'
import type { SpecFile } from '@packages/types/src/spec'

function injectReporterStyle () {
  const style = document.createElement('style')
  style.innerText = `
    .reporter {
      min-height: 0;
      width: 300px;
      left: 750px;
      position: absolute;
    }
  `
  document.head.appendChild(style)
}

export interface Payload {
  base64Config: string
  projectName: string
}

// just listing the actual data we consume, so we can
// tighten the API and types later
export interface ConfigConsumedByNewRunner {
  specs: SpecFile[]
}

export async function injectRunner (ready: () => void) {
  const response = await window.fetch('/api')
  const data = await response.json()
  const script = document.createElement('script')

  script.src = '/__cypress/runner/cypress_runner.js'
  script.type = 'text/javascript'

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = '/__cypress/runner/cypress_runner.css'

  document.head.appendChild(script)
  document.head.appendChild(link)

  injectReporterStyle()

  script.onload = () => {
    // @ts-ignore - just stick config on window until we figure out how we are 
    // going to manage it
    window.config = (window.UnifiedRunner as UnifiedRunner).decodeBase64(data.base64Config)
    ready()
  }
}
