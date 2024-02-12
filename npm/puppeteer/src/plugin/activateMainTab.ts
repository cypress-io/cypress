/// <reference lib="browser">
export const ACTIVATION_TIMEOUT = 2000

export const activateMainTab = () => {
  let timeout: number
  let onMessage: (ev: MessageEvent) => void

  // promise must resolve with a value for chai as promised to test resolution
  return new Promise<boolean>((resolve, reject) => {
    onMessage = (ev) => {
      if (ev.data.message === 'cypress:extension:main:tab:activated') {
        window.removeEventListener('message', onMessage)
        clearTimeout(timeout)
        resolve(true)
      }
    }

    window.addEventListener('message', onMessage)
    window.postMessage({ message: 'cypress:extension:activate:main:tab' })

    setTimeout(() => {
      window.removeEventListener('message', onMessage)
      reject()
    }, ACTIVATION_TIMEOUT)
  })
}
