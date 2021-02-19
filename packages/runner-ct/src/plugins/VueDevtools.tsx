import '@lmiller1990/vue-devtools-inline'
import { UIPlugin } from './UIPlugin'

export function create (root: HTMLElement): UIPlugin {
  const style = document.createElement('style')
  let originalRoot = root

  style.innerText = '.message-container { display: none !important; }'
  document.body.appendChild(style)

  function mount () {
    // NO-OP - the VueDevtools plugin will re-mount itself befoe each test
    // via the beforeTest lifecycle hook.
  }

  function remount () {
    const autIframe = document.getElementsByClassName('aut-iframe')[0]
    const devtools = document.getElementsByClassName('app')
    let root = originalRoot

    if (devtools.length) {
      // we need to replace current devtools with a new one to get a fresh state.
      root = originalRoot.cloneNode() as HTMLElement
      devtools[0].replaceWith(root)
    }

    if (autIframe) {
      // @ts-ignore
      window.VueDevtoolsInline.inlineDevtools(root, autIframe)
    }
  }

  function beforeTest () {
    remount()
  }

  function unmount () {
  }

  function initialize (contentWindow: Window) {
  }

  return {
    name: 'Vue Devtools',
    type: 'devtools',
    mount,
    unmount,
    beforeTest,
    initialize,
  }
}
