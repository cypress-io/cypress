// let originalRoot = window.top.document.querySelector('.ct-devtools-container')

// export const initDevtools = () => {
//   console.log('Here!!!!!')
//   cy.wrap(null).then(() => {
//     console.log(
//       'Confnig', Cypress.config('env.vueDevtools')
//     )
//     return new Cypress.Promise(done => {
//       const autIframe = window.top.document.querySelector('.aut-iframe')
//       const devtools = window.top.document.querySelector('.app')
//       let root = originalRoot

//       if (devtools) {
//         // we need to replace current devtools with a new one to get a fresh state.
//         root = originalRoot.cloneNode()
//         devtools.replaceWith(root)
//       }

//       if (autIframe) {
//         return window.top.VueDevtoolsInline.inlineDevtools(root, autIframe, done)
//       }

//       throw Error('An error occurred when trying to initialize the Vue Devtools plugin.')
//     })
//   })
// }

  // beforeEach(() => {
  //   // wait until devtools have mounted before
  //   // executing the test. This ensures we 
  //   // capture all the events and other useful information.
  //   cy.wrap(null).then(initDevtools)
  // })

