import pDefer from 'p-defer'

export const dfd = pDefer()

export function injectBundle (namespace: string) {
  const script = document.createElement('script')

  script.src = `/${namespace}/runner/cypress_runner.js`
  script.type = 'text/javascript'

  const link = document.createElement('link')

  link.rel = 'stylesheet'
  link.href = `/${namespace}/runner/cypress_runner.css`

  script.onload = () => {
    dfd.resolve()
  }

  document.head.appendChild(script)
  document.head.appendChild(link)
}
