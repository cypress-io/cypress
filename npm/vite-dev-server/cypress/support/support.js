before(() => {
  window.supportFileWasLoaded = true
  originalRoot = document.getElementsByClassName('.ct-devtools-container')[0]
})

let originalRoot

beforeEach(() => {
  console.log('Before Each')
  const mountDevtools = () => {
    return Cypress.Promise(res => {
      const autIframe = document.getElementsByClassName('aut-iframe')[0]
      const devtools = document.getElementsByClassName('app')
      let root = originalRoot

      if (devtools.length) {
        // we need to replace current devtools with a new one to get a fresh state.
        root = originalRoot.cloneNode()
        devtools[0].replaceWith(root)
      }

      if (autIframe) {
        // @ts-ignore
        window.VueDevtoolsInline.inlineDevtools(root, autIframe, noop, res)
      }
    })
  }

  cy.wrap(null).then(() => {
    // return a promise to cy.then() that
    // is awaited until it resolves
    return mountDevtools()
  })
})
