export function renderRunner (ready: () => void) {
  const script = document.createElement('script')

  script.src = '/__cypress/runner/cypress_runner.js'
  script.type = 'text/javascript'

  const link = document.createElement('link')

  link.rel = 'stylesheet'
  link.href = '/__cypress/runner/cypress_runner.css'

  document.head.appendChild(script)
  document.head.appendChild(link)

  script.onload = () => {
    ready()
  }
}
