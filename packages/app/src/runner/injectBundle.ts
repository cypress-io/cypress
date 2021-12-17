export async function injectBundle () {
  const src = '/__cypress/runner/cypress_runner.js'

  const alreadyInjected = document.querySelector(`script[src="${src}"]`)

  if (alreadyInjected) {
    return
  }

  const script = document.createElement('script')

  script.src = src
  script.type = 'text/javascript'

  const link = document.createElement('link')

  link.rel = 'stylesheet'
  link.href = '/__cypress/runner/cypress_runner.css'

  document.head.appendChild(script)
  document.head.appendChild(link)

  return new Promise<void>((resolve) => {
    script.onload = () => resolve()
  })
}
