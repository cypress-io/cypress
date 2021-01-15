import ReactDomExperimental from 'react-dom'
import {
  activate as activateBackend,
  initialize as initializeBackend,
} from 'react-devtools-inline/backend'
import { initialize as initializeFrontend } from 'react-devtools-inline/frontend'

export function render (root: HTMLElement, testFrame: HTMLIFrameElement) {
  // const { contentWindow } = testFrame

  // const devtoolsRoot = ReactDomExperimental.unstable_createRoot(this.refs.devtoolsContainer)
  // testFrame.onload = () => {
  //   debugger;
  //   initializeBackend(contentWindow)
  //   const DevTools = initializeFrontend(contentWindow)

  //   activateBackend(contentWindow)
  //   devtoolsRoot.render(<DevTools browserTheme="dark" />)
  // };
}
