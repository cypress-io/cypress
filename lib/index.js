import { render } from 'react-dom'

// having weak reference to styles prevents garbage collection
// and "losing" styles when the next test starts
const stylesCache = new Map()

const copyStyles = component => {
  // need to find same component when component is recompiled
  // by the JSX preprocessor. Thus have to use something else,
  // like component name
  const hash = component.type.name

  let styles = document.querySelectorAll('head style')
  if (styles.length) {
    console.log('injected %d styles', styles.length)
    stylesCache.set(hash, styles)
  } else {
    console.log('No styles injected for this component, checking cache')
    if (stylesCache.has(hash)) {
      styles = stylesCache.get(hash)
    } else {
      styles = null
    }
  }

  if (!styles) {
    return
  }

  const parentDocument = window.parent.document
  const projectName = Cypress.config('projectName')
  const appIframeId = `Your App: '${projectName}'`
  const appIframe = parentDocument.getElementById(appIframeId)
  const head = appIframe.contentDocument.querySelector('head')
  styles.forEach(style => {
    head.appendChild(style)
  })
}

/* eslint-env mocha */
export const mount = jsx => {
  const html = '<body><div id="app"></div></body>'

  const document = cy.state('document')
  document.write(html)
  document.close()

  render(jsx, document.getElementById('app'))

  copyStyles(jsx)
}
