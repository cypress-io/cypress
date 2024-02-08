export const activateMainTab = () => {
  let timeout: NodeJS.Timeout
  let onMessage: (ev: MessageEvent) => void

  return new Promise<void>((resolve, reject) => {
    onMessage = (ev) => {
      if (ev.data.message === 'cypress:extension:main:tab:activated') {
        window.removeEventListener('message', onMessage)
        clearTimeout(timeout)
        resolve()
      }
    }

    window.addEventListener('message', onMessage)
    window.postMessage({ message: 'cypress:extension:activate:main:tab' })

    setTimeout(() => {
      window.removeEventListener('message', onMessage)
      reject()
    }, 2000)
  })
}
