const testToRun = window.testToRun
const originalIt = window.it

window.it = (title, ...args) => {
  const itFn = title === testToRun ? originalIt : () => {}

  return itFn(title, ...args)
}

window.it.only = () => {
  throw new Error('Instead of putting .only in the spec-under-test, put it in the corresponding test in the parent spec (reporter.error.spec.js, etc)')
}

// eslint-disable-next-line
export const sendXhr = (route) => (win) => {
  const xhr = new win.XMLHttpRequest()

  xhr.open('GET', route)
  xhr.send()

  return xhr
}

// eslint-disable-next-line
export const abortXhr = (route) => (win) => {
  const xhr = sendXhr(route)(win)

  xhr.abort()
}
