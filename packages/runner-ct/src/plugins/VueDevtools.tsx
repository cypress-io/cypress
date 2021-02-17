// import 'vue-devtools-inline'
import { UIPlugin } from './UIPlugin'

export function create (root: HTMLElement): UIPlugin {
  const style = document.createElement('style')

  style.innerText = '.message-container { display: none !important; }'
  document.body.appendChild(style)

  function mount () {
    const autIframe = document.getElementsByClassName('aut-iframe')[0]

    console.error('This feature is still under construction 🔨')

    return

    if (autIframe) {
      // @ts-ignore
      window.VueDevtoolsInline.inlineDevtools(root, autIframe)
    }
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
    initialize,
  }
}
